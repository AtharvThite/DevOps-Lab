const express = require("express");
const cors = require("cors");
const pipelineRoutes = require("./routes/pipelineRoutes");
const config = require("./config/env");

const app = express();

app.use(
  cors({
    origin: config.frontendOrigin,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "devops-pipeline-backend" });
});

app.use("/pipeline", pipelineRoutes);

app.use((error, _req, res, _next) => {
  if (error.message === "Only ZIP uploads are supported") {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: error.message || "Internal server error" });
});

app.use(express.static(path.join(__dirname, '../public')));

// Catch-all route: Send any unmatched routes to the React frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

module.exports = app;
