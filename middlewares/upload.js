const multer = require("multer");
const fs = require("fs");

// Crear carpeta uploads si no existe
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // límite 15MB
  fileFilter: (_req, file, cb) => {
    const ok = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ].includes(file.mimetype);

    if (!ok) return cb(new Error("Formato no permitido (solo PDF, DOCX, TXT)"));
    cb(null, true);
  },
});

module.exports = upload;
