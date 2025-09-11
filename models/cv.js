const mongoose = require("mongoose");

const cvSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: false },
    last_name: { type: String, required: false },
    contact: {
      email: { type: String },
      phone: { type: String },
      address: { type: String },
    },
    experience: [
      {
        company: { type: String },
        role: { type: String },
        start: { type: String },
        end: { type: String },
      },
    ],
    skills: [String],
  },
  { timestamps: true } // crea createdAt y updatedAt automáticamente
);

module.exports = mongoose.model("CV", cvSchema);
