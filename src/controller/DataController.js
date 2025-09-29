const XLSX = require("xlsx");
const archiver = require("archiver");
const Student = require("../models/Student");
const Fee = require("../models/Fee");

const exportStudentData = async (req, res) => {
  try {
    const { rollstart, rollend, "fee-required": feeRequired } = req.query;

    // Validate required parameters
    if (!rollstart || !rollend) {
      return res.status(400).json({
        success: false,
        message: "rollstart and rollend parameters are required",
      });
    }

    const startRoll = parseInt(rollstart);
    const endRoll = parseInt(rollend);

    if (isNaN(startRoll) || isNaN(endRoll) || startRoll > endRoll) {
      return res.status(400).json({
        success: false,
        message: "Invalid roll number range",
      });
    }

    // Fetch students within roll number range
    const students = await Student.find({
      rollNo: { $gte: startRoll, $lte: endRoll },
    }).sort({ rollNo: 1 });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No students found in the specified roll number range",
      });
    }

    // Get roll numbers for fee lookup
    const rollNumbers = students.map((student) => student.rollNo);

    // Fetch fee data for these students
    const fees = await Fee.find({
      studentRollNo: { $in: rollNumbers },
    });

    // Create fee lookup map
    const feeMap = {};
    fees.forEach((fee) => {
      feeMap[fee.studentRollNo] = fee;
    });

    // Prepare student data for Excel (excluding submissions)
    const studentData = students.map((student) => {
      const fee = feeMap[student.rollNo] || {};

      return {
        "Roll No": student.rollNo,
        Name: student.name,
        Class: student.class,
        "Previous School": student.previousSchoolName,
        Medium: student.medium,
        DOB: student.DOB,
        Gender: student.gender,
        Category: student.category,
        State: student.state,
        City: student.city,
        "Pin Code": student.pinCode,
        "Permanent Address": student.permanentAddress,
        "Mobile Number": student.mobileNumber,
        "T-Shirt Size": student.tShirtSize,
        "How Did You Hear About Us": student.howDidYouHearAboutUs,
        "Programme Name": student.programmeName,
        "Emergency Contact": student.emergencyContact,
        "Student Email": student.email,
        "Father Name": student.parent?.fatherName || "",
        "Mother Name": student.parent?.motherName || "",
        "Parent Occupation": student.parent?.occupation || "",
        "Parent Contact": student.parent?.parentContact || "",
        "Parent Email": student.parent?.email || "",
        Batch: student.batch,
        Phone: student.phone,
        Status: student.status,
        "Created At": student.createdAt,
        "Updated At": student.updatedAt,
        // Fee information (excluding submissions)
        "Total Fees": fee.totalFees || 0,
        Discount: fee.discount || 0,
        "Final Fees": fee.finalFees || 0,
        "Approved By": fee.approvedBy || "",
        "Paid Amount": fee.paidAmount || 0,
        "Due Date": fee.dueDate || "",
        "Pending Amount": fee.pendingAmount || 0,
        "Fee Status": fee.status || "UNPAID",
      };
    });

    // Create main workbook with student data
    const workbook = XLSX.utils.book_new();
    const studentSheet = XLSX.utils.json_to_sheet(studentData);
    XLSX.utils.book_append_sheet(workbook, studentSheet, "Students");

    // If fee-required=true, create installment data
    let installmentData = [];
    if (feeRequired === "true") {
      fees.forEach((fee) => {
        if (fee.submissions && fee.submissions.length > 0) {
          fee.submissions.forEach((submission, index) => {
            installmentData.push({
              "Roll No": fee.studentRollNo,
              "Installment No": index + 1,
              Amount: submission.amount || 0,
              Mode: submission.mode || "",
              "Date of Receipt": submission.dateOfReceipt || "",
              "Receipt Number": submission.receiptNumber || "",
              UTR: submission.UTR || "",
            });
          });
        }
      });
    }

    // Set response headers for file download
    if (feeRequired === "true" && installmentData.length > 0) {
      // Create zip file with both Excel files
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="student_data_${startRoll}_to_${endRoll}.zip"`
      );

      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.on("error", (err) => {
        console.error("Archive error:", err);
        res
          .status(500)
          .json({ success: false, message: "Error creating zip file" });
      });

      archive.pipe(res);

      // Add main student data file
      const studentBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });
      archive.append(studentBuffer, {
        name: `students_${startRoll}_to_${endRoll}.xlsx`,
      });

      // Add installment data file
      const installmentWorkbook = XLSX.utils.book_new();
      const installmentSheet = XLSX.utils.json_to_sheet(installmentData);
      XLSX.utils.book_append_sheet(
        installmentWorkbook,
        installmentSheet,
        "Installments"
      );
      const installmentBuffer = XLSX.write(installmentWorkbook, {
        type: "buffer",
        bookType: "xlsx",
      });
      archive.append(installmentBuffer, {
        name: `installments_${startRoll}_to_${endRoll}.xlsx`,
      });

      archive.finalize();
    } else {
      // Return single Excel file
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="students_${startRoll}_to_${endRoll}.xlsx"`
      );

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.send(buffer);
    }
  } catch (error) {
    console.error("Error exporting student data:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  exportStudentData,
};
