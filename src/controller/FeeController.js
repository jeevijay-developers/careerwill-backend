const { parseDate } = require("../helper/RollNumber");
const Fee = require("../models/Fee");
const ReceiptCounter = require("../models/ReceiptCounter");
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

  // if (!receiptNumber) {
  //   return res.status(400).json({ message: "Receipt Number is required" });
  // }

  const RECEPT_COUNTER = await ReceiptCounter.findOne({ id: 1 });
  let COUNTER_NUMBER = RECEPT_COUNTER ? RECEPT_COUNTER.counter : 1000;
  try {
    const student = await Student.findOne({
      rollNo: studentRollNo,
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    let feeDoc;

    if (!student) {
      // Create new fee document with studentName and studentRollNo
      if (!finalFees) {
        return res.status(400).json({ message: "Final Fees is required" });
      }

      if (finalFees !== paidAmount && !dueDate) {
        return res.status(400).json({ message: "Due Date is required" });
      }

      feeDoc = new Fee({
        studentRollNo,
        totalFees: Number(totalFees),
        discount,
        finalFees: Number(finalFees),
        approvedBy,
        paidAmount: Number(paidAmount),
        dueDate: parseDate(dueDate),
        pendingAmount: Number(finalFees) - Number(paidAmount),
        status: Number(finalFees) === Number(paidAmount) ? "PAID" : "PARTIAL",
        submissions: [
          {
            dateOfReceipt: parseDate(dateOfReceipt),
            amount: Number(paidAmount),
            mode,
            receiptNumber: ++COUNTER_NUMBER,
            UTR,
          },
        ],
      });

      await feeDoc.save();

      // Save reference in student document
      // student.fee = feeDoc._id;
      await student.save();
    } else {
      // Update existing fee document
      feeDoc = await Fee.findOne({
        studentRollNo: studentRollNo,
      }); // safe refetch in case populate fails
      // console.log(parseDate(dateOfReceipt));

      // feeDoc.amount += amount;
      feeDoc.paidAmount = Number(feeDoc.paidAmount) + Number(paidAmount);
      feeDoc.pendingAmount = Number(feeDoc.pendingAmount) - Number(paidAmount);
      feeDoc.status =
        Number(feeDoc.finalFees) == Number(feeDoc.paidAmount)
          ? "PAID"
          : "PARTIAL";
      feeDoc.submissions.push({
        dateOfReceipt: parseDate(dateOfReceipt),
        amount: paidAmount,
        mode,
        receiptNumber: ++COUNTER_NUMBER,
        UTR,
      });

      await feeDoc.save();
      await ReceiptCounter.findOneAndUpdate(
        { id: 1 }, // Update the receipt counter
        { counter: COUNTER_NUMBER },
        { new: true, upsert: true }
      );
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
    const page = parseInt(req.query.page) || 1; // Default page = 1
    const limit = parseInt(req.query.limit) || 10; // Default limit = 10
    const skip = (page - 1) * limit;

    const total = await Fee.countDocuments();
    const fees = await Fee.find().skip(skip).limit(limit);

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

    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      data: feesWithNames,
    });
  } catch (err) {
    console.error("Error fetching paginated fees:", err);
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

    if (!rollNo) {
      return res.status(400).json({ message: "Roll number is required" });
    }

    const student = await Student.findOne({ rollNo });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const fees = await Fee.find({ studentRollNo: rollNo });
    res.status(200).json({ fees, studentName: student.name });
  } catch (err) {
    console.error("Error fetching fees by roll number:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
