const router = require("express").Router();

const feeController = require("../controller/FeeController");

router.post("/create-fee-submission", feeController.createFeeSubmission);

module.exports = router;
