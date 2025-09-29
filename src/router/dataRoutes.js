const express = require("express");
const router = express.Router();
const { exportStudentData } = require("../controller/DataController");

// GET /api/data/export-data
router.get("/export-data", exportStudentData);

module.exports = router;
