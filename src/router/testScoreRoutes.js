const express = require("express");
const router = express.Router();
const testScoreController = require("../controller/testScoreController");

// POST /api/test-scores
router.post("/create-test-score", testScoreController.createTestScore);

// GET /api/test-scores
router.get("/get-all-test-scores", testScoreController.getAllTestScores);

// GET /api/test-scores/:id
router.get("/get-test-scores/:id", testScoreController.getTestScoreById);

// GET /api/test-scores/student/:student
router.get(
  "/get-scores/student/:student",
  testScoreController.getScoresByStudent
);

// PUT /api/test-scores/:id
router.put("/update-test-scores/:id", testScoreController.updateTestScore);

// DELETE /api/test-scores/:id
router.delete("/delete-test-scores/:id", testScoreController.deleteTestScore);

module.exports = router;
