const express = require("express");
const router = express.Router();
const {
  scoreUpload,
  studentUpload,
  attendenceUpload,
} = require("../middleware/multer");
const {
  uploadTestScores,
  bulkUploadStudents,
  bulkUploadAttendence,
} = require("../controller/BulkUploadController");

router.post("/upload-test-scores", scoreUpload, uploadTestScores);
router.post("/upload-bulk-students", studentUpload, bulkUploadStudents);
router.post("/upload-bulk-attendence", attendenceUpload, bulkUploadAttendence);

module.exports = router;
