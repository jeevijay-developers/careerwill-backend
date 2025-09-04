const express = require("express");
const {
  updateRole,
  updatePhone,
} = require("../controller/UserRolesController");
const { createUser } = require("../controller/UserController");
const router = express.Router();

router.put("/update-role", updateRole);
router.put("/update-phone", updatePhone);
router.post("/create-user", createUser)

module.exports = router;
