const express = require("express");
const router = express.Router();
const {
  scoreUpload,
  studentUpload,
  attendenceUpload,
  kitUpload,
  feeUpload,
} = require("../middleware/multer");
const {
  uploadTestScores,
  bulkUploadStudents,
  bulkUploadAttendence,
  bulkUploadStudentsSecond,
  bulkUploadKits,
  bulkUploadInstallements,
} = require("../controller/BulkUploadController");

router.post("/upload-test-scores", scoreUpload, uploadTestScores);
router.post("/upload-bulk-students", studentUpload, bulkUploadStudentsSecond);
router.post("/upload-bulk-attendence", attendenceUpload, bulkUploadAttendence);
router.post("/upload-bulk-kits", kitUpload, bulkUploadKits);
router.post("/upload-bulk-submissions", feeUpload, bulkUploadInstallements);

module.exports = router;
