const express = require("express");
const {
  updateRole,
  updatePhone,
} = require("../controller/UserRolesController");
const router = express.Router();

router.put("/update-role", updateRole);
router.put("/update-phone", updatePhone);

module.exports = router;
