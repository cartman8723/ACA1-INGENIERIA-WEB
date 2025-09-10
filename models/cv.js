import mongoose from "mongoose";

const CVSchema = new mongoose.Schema({
  email: String,
  datos_personales: Object,
  residencia: Object,
  educacion: Array,
  experiencia_laboral: Array,
  habilidades: Array,
  archivo: String,
  fecha_registro: { type: Date, default: Date.now }
});

export default mongoose.model("CV", CVSchema);
