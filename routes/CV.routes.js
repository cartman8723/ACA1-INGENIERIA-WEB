const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { saveData, getData } = require("../controller/CV.controller");

const router = express.Router();

// Asegurar carpeta de uploads
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Rutas
router.get("/", (req, res) => {
  res.send("✅ Backend SmartCV corriendo...");
});

router.post("/upload", upload.single("cv"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se recibió archivo" });
  }
  console.log("📄 Archivo recibido:", req.file);
  res.json({ message: "Archivo recibido correctamente", file: req.file });
});

router.post("/save-cv", saveData);
router.get("/get-cvs", getData);

module.exports = router;
