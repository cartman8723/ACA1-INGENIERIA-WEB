const mongoose = require("../config/conectDB.js");

const dataUserSchema = new mongoose.Schema({
    nombre: String,
    apellido: String,
    documento: String,
    contacto: {
        correo: String,
        telefono: String,
        direccion: String,
    },
    experiencia: {
        empresa: String,
        cargo: String,
        inicio: String,
        fin: String,
    },
});


const CVs = mongoose.model("CVs", dataUserSchema);

module.exports = CVs;