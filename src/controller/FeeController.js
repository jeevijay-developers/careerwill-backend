const Fee = require("../models/Fee");
const Student = require("../models/Student");

exports.createFeeSubmission = async (req, res) => {
  const { studentId, amount, paidAmount, dueDate } = req.body;

  try {
    const student = await Student.findById(studentId).populate("fee");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let feeDoc;

    if (!student.fee) {
      // Create new fee document
      feeDoc = new Fee({
        student: studentId,
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
