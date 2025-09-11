require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const cvRoutes = require("./routes/cv.routes");

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({ origin: ["http://localhost:5173"], methods: ["GET", "POST"] }));
app.use(express.json());

// Conexión DB
connectDB();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rutas
app.use("/api/cvs", cvRoutes);

// Healthcheck
app.get("/", (_req, res) => res.send("Backend SmartCV corriendo..."));

// Start server
app.listen(PORT, () =>
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
);
