const Fee = require("../models/Fee");
const Student = require("../models/Student");

exports.createFeeSubmission = async (req, res) => {
  // create if fee is null otherwise update
  const {
    studentRollNo,
    totalFees,
    discount,
    finalFees,
    approvedBy,
    paidAmount,
    dueDate,
    mode,
    dateOfReceipt,
    receiptNumber,
    UTR,
  } = req.body;

  if (!studentRollNo) {
    return res.status(400).json({ message: "Roll number is required" });
  }

  if (!paidAmount) {
    return res.status(400).json({ message: "Paid Amount is required" });
  }

  if (!mode) {
    return res.status(400).json({ message: "Mode of Payment is required" });
  }

  if (!dateOfReceipt) {
    return res.status(400).json({ message: "Date of Receipt is required" });
  }

  if (!receiptNumber) {
    return res.status(400).json({ message: "Receipt Number is required" });
  }

  try {
    const student = await Student.findOne({ rollNo: studentRollNo }).populate(
      "fee"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let feeDoc;

    if (!student.fee) {
      // Create new fee document with studentName and studentRollNo
      if (!finalFees) {
        return res.status(400).json({ message: "Final Fees is required" });
      }

      if (finalFees !== paidAmount && !dueDate) {
        return res.status(400).json({ message: "Due Date is required" });
      }

      feeDoc = new Fee({
        studentRollNo,
        totalFees,
        discount,
        finalFees,
        approvedBy,
        paidAmount,
        dueDate: new Date(dueDate),
        pendingAmount: finalFees - paidAmount,
        status: finalFees === paidAmount ? "PAID" : "PARTIAL",
        submissions: [
          {
            dateOfReceipt: new Date(dateOfReceipt),
            amount: paidAmount,
            mode,
            receiptNumber,
            UTR,
          },
        ],
      });

      await feeDoc.save();

      // Save reference in student document
      student.fee = feeDoc._id;
      await student.save();
    } else {
      // Update existing fee document
      feeDoc = await Fee.findById(student.fee._id); // safe refetch in case populate fails
      console.log(new Date(dateOfReceipt));

      // feeDoc.amount += amount;
      feeDoc.paidAmount = Number(feeDoc.paidAmount) + Number(paidAmount);
      feeDoc.pendingAmount = Number(feeDoc.pendingAmount) - Number(paidAmount);
      feeDoc.status =
        Number(feeDoc.finalFees) == Number(feeDoc.paidAmount)
          ? "PAID"
          : "PARTIAL";
      feeDoc.submissions.push({
        dateOfReceipt: new Date(dateOfReceipt),
        amount: paidAmount,
        mode,
        receiptNumber,
        UTR,
      });

      await feeDoc.save();
    }

    res.status(200).json({
      message: "Fee record updated successfully",
      fee: feeDoc,
    });
  } catch (err) {
    console.error("Error creating fee submission:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find();
    // For each fee, fetch the student name by rollNo
    const feesWithNames = await Promise.all(
      fees.map(async (fee) => {
        const student = await Student.findOne({ rollNo: fee.studentRollNo });
        return {
          ...fee.toObject(),
          studentName: student ? student.name : "Unknown",
        };
      })
    );
    res.status(200).json(feesWithNames);
  } catch (err) {
    console.error("Error fetching all fees:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateFeeOfStudent = async (req, res) => {
  const { paidAmount, date } = req.body;
  const feeId = req.params.id;

  try {
    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    // Add new submission
    fee.paidAmount += paidAmount;
    fee.submissions.push({
      date: date ? new Date(date) : new Date(),
      amount: paidAmount,
    });
    // Recalculate status
    fee.status = fee.amount === fee.paidAmount ? "PAID" : "PARTIAL";

    await fee.save();
    res.status(200).json({ message: "Fee record updated successfully", fee });
  } catch (err) {
    console.error("Error updating fee record:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getFeesByRollNumber = async (req, res) => {
  try {
    const { rollNo } = req.params;
    const fees = await Fee.find({ studentRollNo: rollNo });
    res.status(200).json(fees);
  } catch (err) {
    console.error("Error fetching fees by roll number:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
