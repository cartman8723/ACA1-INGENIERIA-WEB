const CVs = require("../models/CV.model.js");


/* Endpoint para guardar la data de un usuario en la DB */
/* app.post("/api/save-cv", async (req, res) => { */
const saveData = async (req, res) => {
  try {
    const newCvData = new CVs(req.body);
    await newCvData.save();
    res.json({ message: "Datos guardados correctamente", data: newCvData });
  } catch (error) {
    console.error("Error al guardar datos:", error);
    res.status(500).json({ message: "Error al guardar datos" });
  }
};



/* Endpoint para consultar todos los usuarios */
/* app.get("/api/get-cvs", async (req, res) => { */
const getData = async (req, res) => {
  try {
    const allCvs = await CVs.find();
    res.json({ message: "Datos obtenidos correctamente", data: allCvs });
  } catch (error) {
    console.error("Error al obtener datos:", error);
    res.status(500).json({ message: "Error al obtener datos" });
  }
};



module.exports = { saveData, getData };