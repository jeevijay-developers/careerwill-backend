const router = require("express").Router();
const {
  createStudent,
  uploadImage,
  getAllStudents,
  getStudentById,
  findParentByEmail,
  getStudentTestScores,
  getStudentWithIncompleteKit,
  updateStudentKit,
  searchStudents,
  checkRollNumberExists,
} = require("../controller/StudentController");
const { upload } = require("../middleware/multer");

router.post("/create-student", createStudent);

router.post("/upload-image", upload, uploadImage);

router.get("/get-all-students", getAllStudents);

router.get("/incomplete-kit/:batchId", getStudentWithIncompleteKit);

router.get("/get-student-by-id/:id", getStudentById);

router.put("/update-student-kit/:id", updateStudentKit);

router.get("/find-parent-by-email/:email", findParentByEmail);

router.get("/get-student-test-scores/:rollNumber", getStudentTestScores);

router.get("/search-students", searchStudents);

router.get("/check-roll-number/:rollNumber", checkRollNumberExists);

module.exports = router;
