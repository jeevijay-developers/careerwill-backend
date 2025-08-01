const express = require("express");
const router = express.Router();
const { scoreUpload, studentUpload } = require("../middleware/multer");
const {
  uploadTestScores,
  bulkUploadStudents,
} = require("../controller/BulkUploadController");

router.post("/upload-test-scores", scoreUpload, uploadTestScores);
router.post("/upload-bulk-students", studentUpload, bulkUploadStudents);

module.exports = router;
