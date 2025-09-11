const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const { uploadCV, listCVs } = require("../controllers/cv.controller");

// 📌 Subir un CV
router.post("/upload", upload.single("cv"), uploadCV);

// 📌 Listar todos los CVs
router.get("/", listCVs);

module.exports = router;
