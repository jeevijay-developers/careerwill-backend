const router = require("express").Router();
const {
  createStudent,
  uploadImage,
} = require("../controller/StudentController");
const { upload } = require("../middleware/multer");

router.post("/create-student", createStudent);

router.post("/upload-image", upload, uploadImage);

module.exports = router;
