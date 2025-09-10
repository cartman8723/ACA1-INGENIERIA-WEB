require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const pdfParse = require("pdf-parse");

// Gemini SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({ origin: ["http://localhost:5173"], methods: ["GET","POST"] }));
app.use(express.json());

// ✅ Conexión a MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error conexión Mongo:", err));

// ✅ Esquema y modelo
const cvSchema = new mongoose.Schema(
  {
    first_name: String,
    last_name: String,
    contact: { email: String, phone: String, address: String },
    experience: [{ company: String, role: String, start: String, end: String }],
    skills: [String],
  },
  { timestamps: true }
);
const CV = mongoose.model("CV", cvSchema);

// ✅ Inicializa Gemini
if (!process.env.GOOGLE_API_KEY) {
  console.error("❌ Falta GOOGLE_API_KEY en .env");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);

// ✅ Esquema de salida esperado
const responseSchema = {
  type: "object",
  properties: {
    personal: {
      type: "object",
      properties: {
        full_name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        address: { type: "string" },
      },
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          role: { type: "string" },
          start_date: { type: "string" },
          end_date: { type: "string" },
          current: { type: "boolean" },
        },
      },
    },
    skills: { type: "array", items: { type: "string" } },
  },
};

// ✅ Carpeta de uploads
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ✅ Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ].includes(file.mimetype);
    if (!ok) return cb(new Error("Formato no permitido (solo PDF, DOCX, TXT)"));
    cb(null, true);
  },
});

// ---------- UTIL: extracción con Gemini ----------
async function extractWithGemini(filePath, mimeType) {
  const uploadResp = await fileManager.uploadFile(filePath, {
    mimeType,
    displayName: path.basename(filePath),
  });
  const fileUri = uploadResp.file.uri;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Eres un extractor de información de hojas de vida (CV).
Devuelve SOLO un JSON que cumpla con el esquema dado.
No inventes datos. Omite los campos que no aparezcan.
`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }, { fileData: { fileUri, mimeType } }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  });

  return JSON.parse(result.response.text());
}

// ---------- Rutas ----------
app.get("/", (_req, res) => res.send("Backend SmartCV corriendo..."));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Upload CV
app.post("/api/upload", upload.single("cv"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No se recibió archivo" });

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  try {
    // 1) Extraer con Gemini
    let aiData = {};
    try {
      aiData = await extractWithGemini(filePath, mimeType);
    } catch (e) {
      console.error("⚠️ Gemini no pudo extraer JSON:", e.message);
      aiData = {};
    }

    // 2) Fallback con pdf-parse
    let text = "";
    try {
      const buffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(buffer);
      text = pdfData.text || "";
    } catch {}

    const emailFallback = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/)?.[0] || "";
    const phoneFallback =
      text.match(/(\+?\d{1,3}[-. ]?)?\(?\d{2,4}\)?[-. ]?\d{3,4}[-. ]?\d{3,4}/)?.[0] || "";

    // 3) Mapear a esquema
    const fullName = aiData?.personal?.full_name || "";
    const parts = fullName.trim().split(/\s+/);
    const first_name = parts[0] || "";
    const last_name = parts.slice(1).join(" ") || "";

    const contact = {
      email: aiData?.personal?.email || emailFallback,
      phone: aiData?.personal?.phone || phoneFallback,
      address: aiData?.personal?.address || "",
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

    res.json({
      message: "CV procesado y guardado correctamente",
      cv: newCV,
      raw_ai: aiData,
    });
  } catch (err) {
    console.error("❌ Error procesando CV:", err);
    res.status(500).json({ error: "Error procesando CV", details: err.message });
  } finally {
    try {
      fs.unlinkSync(filePath); // borra archivo temporal
    } catch {}
  }
});

// Listar CVs
app.get("/api/cvs", async (_req, res) => {
  try {
    const cvs = await CV.find().sort({ createdAt: -1 });
    res.json(cvs);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo los CVs" });
  }
});

// Start server
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
