const router = require("express").Router();

const feeController = require("../controller/FeeController");

router.post("/create-fee-submission", feeController.createFeeSubmission);
router.get("/get-all-fees", feeController.getAllFees);
router.put("/update-fee/:id", feeController.updateFeeOfStudent);
router.get(
  "/get-fee-by-roll-number/:rollNo",
  feeController.getFeesByRollNumber
);

module.exports = router;
