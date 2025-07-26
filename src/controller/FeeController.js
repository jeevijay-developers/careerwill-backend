const Fee = require("../models/Fee");
const Student = require("../models/Student");

exports.createFeeSubmission = async (req, res) => {
  const { studentRollNo, amount, paidAmount, dueDate } = req.body;

  try {
    const student = await Student.findOne({ rollNo: studentRollNo }).populate("fee");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let feeDoc;

    if (!student.fee) {
      // Create new fee document with studentName and studentRollNo
      feeDoc = new Fee({
        studentRollNo: student.rollNo,
        amount,
        paidAmount,
        dueDate,
        status: amount === paidAmount ? "PAID" : "PARTIAL",
        submissions: [{ date: new Date(), amount: paidAmount }],
      });

      await feeDoc.save();

      // Save reference in student document
      student.fee = feeDoc._id;
      await student.save();
    } else {
      // Update existing fee document
      feeDoc = await Fee.findById(student.fee._id); // safe refetch in case populate fails

      // feeDoc.amount += amount;
      feeDoc.paidAmount += paidAmount;
      feeDoc.status = feeDoc.amount === feeDoc.paidAmount ? "PAID" : "PARTIAL";
      feeDoc.submissions.push({ date: new Date(), amount: paidAmount });

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
    const feesWithNames = await Promise.all(fees.map(async (fee) => {
      const student = await Student.findOne({ rollNo: fee.studentRollNo });
      return {
        ...fee.toObject(),
        studentName: student ? student.name : "Unknown"
      };
    }));
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
    fee.submissions.push({ date: date ? new Date(date) : new Date(), amount: paidAmount });
    // Recalculate status
    fee.status = fee.amount === fee.paidAmount ? "PAID" : "PARTIAL";

    await fee.save();
    res.status(200).json({ message: "Fee record updated successfully", fee });
  } catch (err) {
    console.error("Error updating fee record:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
