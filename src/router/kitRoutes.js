const express = require("express");
const router = express.Router();
const kitController = require("../controller/KitController");

// POST /kits - create new kit
router.post("/create-kit", kitController.createKit);

// GET /kits - fetch all kits
router.get("/get-all-kits", kitController.getAllKits);

// GET /kits/:id - get kit by ID
router.get("/get-kit-by-id/:id", kitController.getKitById);

// PUT /kits/:id - update kit
router.put("/update-kit-by-id/:id", kitController.updateKit);

// DELETE /kits/:id - delete kit
router.delete("/delete-kit-by-id/:id", kitController.deleteKit);

module.exports = router;
