
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Asegurar carpeta de uploads
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Configuración de multer (archivos en carpeta uploads/)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("✅ Backend SmartCV corriendo...");
});

// Ruta para subir CV
app.post("/api/upload", upload.single("cv"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se recibió archivo" });
  }

  console.log("📄 Archivo recibido:", req.file);

  res.json({ message: "Archivo recibido correctamente", file: req.file });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
