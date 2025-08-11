const express = require("express");
const { updateRole } = require("../controller/UserRolesController");
const router = express.Router();

router.put("/update-role", updateRole);
