// routes/batchRoutes.js
const express = require("express");
const router = express.Router();
const batchController = require("../controller/BatchController");

// Optional: Require role-based middleware here if needed
// const { verifyAdmin } = require("../middleware/auth");

router.post("/create-batch", batchController.createBatch);
router.get("/get-all-batches", batchController.getAllBatches);
router.get("/get-all-batches-names", batchController.getAllBatchesName);
router.get("/get-student-batches", batchController.getAllStudentBatches);
router.post("/sync-batches", batchController.syncBatches);
router.get("/get-batch-by-id/:id", batchController.getBatchById);
router.put("/update-batch-by-id/:id", batchController.updateBatch);
router.delete("/delete-batch-by-id/:id", batchController.deleteBatch);

module.exports = router;
