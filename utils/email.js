const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


async function sendRegistrationEmail(toEmail, name) {
  try {
    const info = await transporter.sendMail({
      from: `"SmartCV" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      bcc: process.env.EMAIL_USER, // 👈 siempre recibes copia
      subject: "✅ Registro de hoja de vida",
      html: `
        <h2>Hola ${name || ""},</h2>
        <p>Tu hoja de vida se ha registrado exitosamente en nuestra plataforma.</p>
        <p>Gracias por confiar en SmartCV 🚀</p>
      `,
    });

    console.log("📧 Gmail aceptó el envío:", info.accepted, "MessageID:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Error en sendRegistrationEmail:", err);
    throw err; // 👈 relanza error para que el controlador lo capture
  }
}

module.exports = { sendRegistrationEmail };
