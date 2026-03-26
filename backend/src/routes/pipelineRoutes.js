const express = require("express");
const multer = require("multer");
const {
  runPipeline,
  getPipelineStatus,
  getPipelineLogs,
  getPipelineHistory,
} = require("../controllers/pipelineController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (_req, file, callback) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, callback) => {
    if (!file.originalname.toLowerCase().endsWith(".zip")) {
      callback(new Error("Only ZIP uploads are supported"));
      return;
    }
    callback(null, true);
  },
});

router.post("/run", upload.single("codeZip"), runPipeline);
router.get("/status/:id", getPipelineStatus);
router.get("/logs/:id", getPipelineLogs);
router.get("/history", getPipelineHistory);

module.exports = router;
