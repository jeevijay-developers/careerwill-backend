const express = require("express");
const router = express.Router();
const { getSummaryReport } = require("../controller/ReportController");

// GET /api/report/summary
router.get("/summary", getSummaryReport);

module.exports = router;
