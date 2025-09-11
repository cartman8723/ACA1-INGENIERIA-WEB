const fs = require("fs");
const pdfParse = require("pdf-parse");
const CV = require("../models/cv");
const { extractWithGemini } = require("../services/gemini.service");
const { sendRegistrationEmail } = require("../utils/email");

const uploadCV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se recibió archivo" });
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  try {
    // 1) Extraer con Gemini
    let aiData = {};
    try {
      aiData = await extractWithGemini(filePath, mimeType);
    } catch {
      aiData = {};
    }

    // 2) Fallback con pdf-parse
    let text = "";
    try {
      const buffer = await fs.promises.readFile(filePath);
      const pdfData = await pdfParse(buffer);
      text = pdfData.text || "";
    } catch {}

    const emailFallback =
      text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/)?.[0] || "";
    const phoneFallback =
      text.match(/(\+?\d{1,3}[-. ]?)?\(?\d{2,4}\)?[-. ]?\d{3,4}[-. ]?\d{3,4}/)?.[0] || "";

    // 3) Mapear a esquema
    const fullName = aiData?.personal?.full_name || "";
    const parts = fullName.trim().split(/\s+/);
    const first_name = parts[0] || "";
    const last_name = parts.slice(1).join(" ") || "";

    const rawEmail = aiData?.personal?.email || emailFallback || "";
    const cleanEmail = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const contact = {
      email: cleanEmail,
      phone: (aiData?.personal?.phone || phoneFallback || "").trim(),
      address: (aiData?.personal?.address || "").trim(),
    };

    const experience =
      (aiData?.experience || []).map((e) => ({
        company: e?.company || "",
        role: e?.role || "",
        start: e?.start_date || "",
        end: e?.end_date || (e?.current ? "Actual" : ""),
      })) || [];

    const skills = Array.isArray(aiData?.skills) ? aiData.skills.filter(Boolean) : [];

    const structuredData = { first_name, last_name, contact, experience, skills };

    // 4) Guardar en Mongo
    const newCV = new CV(structuredData);
    await newCV.save();

    // 5) Responder rápido al cliente
    res.json({
      message: "✅ CV procesado y guardado correctamente",
      cv: newCV,
    });

    // 6) Enviar correo en segundo plano
    if (emailRegex.test(cleanEmail)) {
      try {
        await sendRegistrationEmail(cleanEmail, `${first_name} ${last_name}`);
      } catch {}
    }
  } catch (err) {
    res.status(500).json({ error: "Error procesando CV", details: err.message });
  } finally {
    try {
      await fs.promises.unlink(filePath); // elimina archivo temporal
    } catch {}
  }
};

const listCVs = async (_req, res) => {
  try {
    const cvs = await CV.find({}, "first_name last_name contact.email contact.phone createdAt")
      .sort({ createdAt: -1 });

    res.json(cvs);
  } catch {
    res.status(500).json({ error: "Error obteniendo los clientes" });
  }
};


module.exports = { uploadCV, listCVs };
