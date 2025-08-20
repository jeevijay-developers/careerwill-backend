const express = require("express");
const router = express.Router();
const {
  scoreUpload,
  studentUpload,
  attendenceUpload,
  kitUpload,
} = require("../middleware/multer");
const {
  uploadTestScores,
  bulkUploadStudents,
  bulkUploadAttendence,
  bulkUploadStudentsSecond,
  bulkUploadKits,
} = require("../controller/BulkUploadController");

router.post("/upload-test-scores", scoreUpload, uploadTestScores);
router.post("/upload-bulk-students", studentUpload, bulkUploadStudentsSecond);
router.post("/upload-bulk-attendence", attendenceUpload, bulkUploadAttendence);
router.post("/upload-bulk-kits", kitUpload, bulkUploadKits);

module.exports = router;
