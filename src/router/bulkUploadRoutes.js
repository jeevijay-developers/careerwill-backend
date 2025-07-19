const express = require("express");
const router = express.Router();
const { scoreUpload } = require("../middleware/multer");
const { uploadTestScores } = require("../controller/BulkUploadController");

router.post("/upload-test-scores", scoreUpload, uploadTestScores);

module.exports = router;
