const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // Limit file size to 5MB
  },
});

module.exports = {
  upload: upload.single("image"), // Expecting a single file with the field name 'image'
  scoreUpload: upload.single("scoresFile"), // Expecting a single file with the field name 'file'
  studentUpload: upload.single("studentFile"), // Expecting a single file with the field name 'file'
  attendenceUpload: upload.single("attendenceFile"),
  kitUpload: upload.single("kitFile"),
  uploadMultiple: upload.array("images", 10), // Expecting multiple files with the
};
