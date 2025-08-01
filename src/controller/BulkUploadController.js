const xlsx = require("xlsx");
const mongoose = require("mongoose");
const { getAllSubjects } = require("../helper/Subject");
const TestScore = require("../models/TestScore");
const Fee = require("../models/Fee");
const Student = require("../models/Student");
exports.uploadTestScores = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  // Use a session for transactional integrity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // --- 1. Parse the Excel File ---
    const { date, name } = req.body;
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!date || !name) {
      return res.status(400).json({ message: "Date and Name are required." });
    }

    const nameExists = await TestScore.findOne({ name });
    if (nameExists) {
      return res
        .status(400)
        .json({ message: "A test score with this name already exists." });
    }

    if (data.length === 0) {
      return res
        .status(400)
        .json({ message: "The uploaded Excel file is empty." });
    }

    const scoresToInsert = [];
    // const processedStudents = new Map(); // Cache to avoid duplicate DB lookups

    for (const row of data) {
      const scoreObject = {
        rollNumber: row["Roll No."],
        student: row["Student Name"]?.toLowerCase().trim() || "N/A",
        father: row["Students Father Name"]?.toLowerCase().trim() || "N/A",
        batch: row["Batch"] || "N/A",
        percentile: row["Percentile"] || 0,
        total: row["Total"] || 0,
        rank: row["Test Rank"] || 0,
        subjects: [],
        date: new Date(date),
        name: name,
      };
      // create subjects array from the row
      const subjects = getAllSubjects();
      for (const prop in row) {
        if (subjects.includes(`${prop}`)) {
          // console.log(prop);
          const subjectName = prop.toLowerCase().trim();
          const marks = row[prop];
          if (marks !== undefined && marks !== null) {
            scoreObject.subjects.push({
              name: subjectName,
              marks: parseFloat(marks),
            });
          }
        }
      }
      // console.log("Processing row:", { ...row });
      const testScore = new TestScore(scoreObject);

      scoresToInsert.push(testScore);
    }
    // console.dir(scoresToInsert);
    // --- 2. Process Each Row from the Excel File ---

    // console.log("Processing uploaded test scores...", data);

    // --- 3. Bulk Insert the Data ---
    await TestScore.insertMany(scoresToInsert, { session });

    // --- 4. Commit the Transaction ---
    await session.commitTransaction();
    res.status(201).json({
      message: `Successfully uploaded and processed ${scoresToInsert.length} test scores.`,
    });
  } catch (error) {
    // --- 5. Abort Transaction on Error ---
    await session.abortTransaction();
    console.error("Upload processing error:", error);
    res.status(500).json({
      message: "An error occurred during file processing.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

exports.bulkUploadStudents = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const insertedStudents = [];

    for (const row of sheetData) {
      // console.log(row[`student mobile no`]);
      if (!row[`student mobile no`] || !row[`Parents Contact No.`]) {
        console.log(row[`student mobile no`]);
        await session.abortTransaction();
        return res.status(400).json({
          error: "Mobile numbers are required for both student and parent.",
        });
      }

      if (!row[`FINAL FEE`] || !row[`Mode of Payment`]) {
        await session.abortTransaction();
        return res.status(400).json({
          error: "Fee details are required.",
        });
      }
      const rollNoUsed = await Student.findOne({
        rollNo: row[`ROLL NO.`],
      });
      if (rollNoUsed) {
        await session.abortTransaction();
        return res.status(400).json({
          error: "Roll number already exists.",
        });
      }

      const newStudent = new Student({
        rollNo: row[`ROLL NO.`],
        name: row["Student Name"] || "N/A",
        class: row[`Class`],
        previousSchoolName: row[`Previous School Name`] || "",
        medium: row[`Medium`] || "",
        DOB: row[`DOB`] || "",
        gender: row[`Gender`],
        category: row[`Category`] || "",
        state: row[`State`] || "",
        city: row[`City`] || "",
        pinCode: row[`Pincode`] || "",
        permanentAddress: row[`Permanent Address`] || "",
        mobileNumber: row[`student mobile no`],
        tShirtSize: row[`T-SHIRT SIZE`] || "",
        howDidYouHearAboutUs: row[`How did you know about career will`] || "",
        programmeName: row[`Programme Name`] || "",
        emergencyContact: row[`Emergency Local Contact No`],
        email: row[`Email ID`] || "",
        phone: row[`student mobile no`],
        parent: {
          occupation: row[`Parents Occupation`] || "",
          fatherName: row[`Father's Name`] || "",
          motherName: row[`Mother's Name`] || "",
          parentContact: row[`Parents Contact No.`],
          email: row[`Parents Email`] || "", // assuming there's an email column
        },
        batch: row[`BATCH NAME`],
      });

      const savedStudent = await newStudent.save({ session });

      const fee = new Fee({
        studentRollNo: savedStudent.rollNo,
        totalFees: row[`Total Fees`],
        discount: row[`Discount`] || 0,
        finalFees: row[`FINAL FEE`],
        approvedBy: row[`Approved By`] || "",
        paidAmount: row[`Received Amount`] || 0,
        pendingAmount:
          row[`Pending Fees`] ||
          Number(row[`FINAL FEE`]) - row[`Received Amount`],
        dueDate:
          new Date(row[`Expected Date of Receipt of Pending Fees`]) || null,
        status:
          Number(row[`FINAL FEE`]) === Number(row[`Received Amount`])
            ? "PAID"
            : "PARTIAL",
        submissions: [
          {
            amount: row[`Received Amount`],
            mode: row[`Mode of Payment`] || "N/A",
            dateOfReceipt: new Date(row[`Date of Receipt`]),
            receiptNumber: row[`Receipt No.`] || "",
            UTR: row[`UTR NO.`] || "",
            date: new Date(row[`Date of Receipt`]), // required in schema
          },
        ],
      });

      const savedFee = await fee.save({ session });

      savedStudent.fee = savedFee._id;
      await savedStudent.save({ session });

      insertedStudents.push(savedStudent);
    }

    await session.commitTransaction();
    res.status(201).json({
      message: "Bulk upload successful",
      insertedCount: insertedStudents.length,
    });
  } catch (err) {
    console.error("Error in bulk upload:", err);
    await session.abortTransaction();
    res.status(500).json({ error: "Bulk upload failed", details: err.message });
  } finally {
    session.endSession();
  }
};
