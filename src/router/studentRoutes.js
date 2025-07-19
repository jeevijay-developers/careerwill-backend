const router = require("express").Router();
const {
  createStudent,
  uploadImage,
  getAllStudents,
  getStudentById,
  findParentByEmail,
} = require("../controller/StudentController");
const { upload } = require("../middleware/multer");

router.post("/create-student", createStudent);

router.post("/upload-image", upload, uploadImage);

router.get("/get-all-students", getAllStudents);
router.get("/get-student-by-batch/:batchId", getStudentById);
router.get("/get-student-by-id/:id", getStudentById);

router.get("/find-parent-by-email/:email", findParentByEmail);

module.exports = router;
