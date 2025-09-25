const xlsx = require("xlsx");
const mongoose = require("mongoose");
const { getAllSubjects } = require("../helper/Subject");
const TestScore = require("../models/TestScore");
const Fee = require("../models/Fee");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const { parseDate } = require("../helper/RollNumber");
const Kit = require("../models/Kit");
const ReceiptCounter = require("../models/ReceiptCounter");
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

    const DATE = parseDate(date) ? parseDate(date).toISOString() : null;
    // console.log(DATE);

    for (const row of data) {
      const scoreObject = {
        rollNumber: row["Roll No"],
        student: row["Student Name"] || "N/A",
        father: row["Students Father Name"] || "N/A",
        batch: row["Batch"] || "N/A",
        percentile: row["Percentile"] || 0,
        total: row["Total"] || 0,
        rank: row["Test Rank"] || 0,
        subjects: [],
        date: DATE,
        name: name,
      };
      // create subjects array from the row
      const subjects = getAllSubjects();
      for (const prop in row) {
        if (subjects.includes(`${prop}`)) {
          // console.log(prop);
          const subjectName = prop ?? "N/A";
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
          Number(row[`FINAL FEE`]) - Number(row[`Received Amount`]),
        dueDate: parseDate(row[`Expected Date of Receipt of Pending Fees`])
          ? parseDate(
              row[`Expected Date of Receipt of Pending Fees`]
            ).toISOString()
          : null,
        status:
          Number(row[`FINAL FEE`]) === Number(row[`Received Amount`])
            ? "PAID"
            : "PARTIAL",
        submissions: [
          {
            amount: row[`Received Amount`] || 0,
            mode: row[`Mode of Payment`] || "N/A",
            dateOfReceipt: parseDate(row[`Date of Receipt`])
              ? parseDate(row[`Date of Receipt`]).toISOString()
              : null,
            receiptNumber: row[`Receipt No.`] || "",
            UTR: row[`UTR NO.`] || "",
            date: parseDate(row[`Date of Receipt`])
              ? parseDate(row[`Date of Receipt`])
              : null, // required in schema
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

exports.bulkUploadAttendence = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const DATE = parseDate(date) ? parseDate(date).toISOString() : null;
    if (!DATE) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const workbook = xlsx.read(req.file.buffer, {
      cellDates: true,
      type: "buffer",
    });

    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils
      .sheet_to_json(workbook.Sheets[sheetName])
      .slice(5); // Skip first 5 rows (header)

    const attendenceData = sheetData.map((row) => ({
      rollNo: row[`Career Will Information Centre Pvt LTD`] || "N/A",
      name: row[`__EMPTY`] || "N/A",
      inTime: row[`__EMPTY_2`] || "N/A",
      outTime: row[`__EMPTY_3`] || "N/A",
      lateArrival: row[`__EMPTY_4`] || "N/A",
      earlyDeparture: row[`__EMPTY_5`] || "N/A",
      workingHours: row[`__EMPTY_6`] || "N/A",
      otDuration: row[`__EMPTY_7`] || "N/A",
      presentStatus: row[`__EMPTY_8`] || "N/A",
      date: DATE,
    }));

    const insertedAttendences = await Attendance.insertMany(attendenceData, {
      session,
    });

    await session.commitTransaction();

    res.status(201).json({
      message: "Bulk upload successful",
      insertedCount: insertedAttendences.length,
      data: insertedAttendences,
    });
  } catch (err) {
    console.error("Error in bulk upload:", err);
    await session.abortTransaction();
    res.status(500).json({ error: "Bulk upload failed", details: err.message });
  } finally {
    session.endSession();
  }
};

exports.bulkUploadStudentsSecond = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Ensure a file is uploaded
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Roll numbers for validation
    const rollNumbers = sheetData.map((row) => row[`ROLL NO.`]).filter(Boolean);

    if (rollNumbers.length === 0) {
      return res
        .status(400)
        .json({ error: "Roll number is required for each student." });
    }

    // Check if any of the roll numbers already exist
    const existingStudents = await Student.find({
      rollNo: { $in: rollNumbers },
    }).session(session);
    if (existingStudents.length > 0) {
      return res.status(400).json({ error: "Roll number already exists." });
    }

    // Prepare students and fees data
    const students = [];
    const fees = [];
    let insertedCount = 0;
    const RECEPT_COUNTER = await ReceiptCounter.findOne({ id: 1 }).session(
      session
    );
    let COUNTER_NUMBER = RECEPT_COUNTER ? RECEPT_COUNTER.counter : 1000;

    for (const row of sheetData) {
      // Validate mobile numbers and fee details
      if (!row[`student mobile no`] || !row[`Parents Contact No.`]) {
        await session.abortTransaction();
        return res.status(400).json({
          error: "Mobile numbers are required for both student and parent.",
        });
      }

      if (!row[`FINAL FEE`] || !row[`Mode of Payment`]) {
        console.log(row[`Mode of Payment`]);
        console.log(row[`FINAL FEE`]);

        await session.abortTransaction();
        return res.status(400).json({
          error: "Fee details are required.",
        });
      }

      // Create student document
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

      // Create fee document
      const fee = new Fee({
        studentRollNo: row[`ROLL NO.`],
        totalFees: row[`Total Fees`],
        discount: row[`Discount`] || 0,
        finalFees: row[`FINAL FEE`],
        approvedBy: row[`Approved By`] || "",
        paidAmount: row[`Received Amount`] || 0,
        pendingAmount:
          row[`Pending Fees`] ||
          Number(row[`FINAL FEE`]) - Number(row[`Received Amount`]),
        dueDate: parseDate(row[`Expected Date of Receipt of Pending Fees`])
          ? parseDate(
              row[`Expected Date of Receipt of Pending Fees`]
            ).toISOString()
          : null,
        status:
          Number(row[`FINAL FEE`]) === Number(row[`Received Amount`])
            ? "PAID"
            : "PARTIAL",
        submissions: [
          {
            amount: row[`Received Amount`] || 0,
            mode: row[`Mode of Payment`] || "N/A",
            dateOfReceipt: parseDate(row[`Date of Receipt`])
              ? parseDate(row[`Date of Receipt`]).toISOString()
              : null,
            receiptNumber: row[`Receipt No.`] || ++COUNTER_NUMBER,
            UTR: row[`UTR NO.`] || "",
            date: parseDate(row[`Date of Receipt`])
              ? parseDate(row[`Date of Receipt`])
              : null, // required in schema
          },
        ],
      });

      students.push(newStudent);
      fees.push(fee);
    }

    // Insert students and fees in bulk
    await Student.insertMany(students, { session });
    await Fee.insertMany(fees, { session });
    await ReceiptCounter.findOneAndUpdate(
      { id: 1 },
      { counter: COUNTER_NUMBER },
      { session }
    );

    // Commit transaction if everything is successful
    await session.commitTransaction();

    res.status(201).json({
      message: "Bulk upload successful",
      insertedCount: students.length,
    });
  } catch (err) {
    console.error("Error in bulk upload:", err);
    await session.abortTransaction();
    res.status(500).json({ error: "Bulk upload failed", details: err.message });
  } finally {
    session.endSession();
  }
};

exports.bulkUploadKits = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res
        .status(400)
        .json({ error: "The uploaded Excel file is empty." });
    }

    // cache existing kits
    let EXISTED_KITS = await Kit.find();
    let NOT_FOUND_ROLL_NUMBERS = [];

    // --- Build KIT_TO_ASSIGN only once from first row ---
    const NEW_KITS = data[0]["kits"]
      ? data[0]["kits"].split(",").map((k) => k.trim())
      : [];

    let KIT_TO_ASSIGN = [];

    // Ensure all kits exist (atomic find-or-create)
    const createdOrFoundKits = await Promise.all(
      NEW_KITS.map(async (kit) => {
        const normalizedName = kit.trim().toLowerCase();

        // Try to find existing kit
        let existingKit = EXISTED_KITS.find((k) => k.name === normalizedName);

        if (existingKit) {
          return existingKit;
        }

        // Create new if not exists
        let newKit = await Kit.findOneAndUpdate(
          { name: normalizedName },
          { $setOnInsert: { description: data[0]["description"] || "" } },
          { new: true, upsert: true }
        );

        EXISTED_KITS.push(newKit);
        return newKit;
      })
    );

    KIT_TO_ASSIGN = createdOrFoundKits.map((k) => k._id);

    // --- Assign kits to students ---
    // let STUDENT_ARRAY = [];
    // Extract all roll numbers from Excel
    const BULK_ROLL_NUMBERS = data
      .map((row) => Number(row["rollnum"]))
      .filter((rn) => !isNaN(rn));

    // find all matching roll numbers in one query
    const EXISTED_STUDENTS = await Student.find({
      rollNo: { $in: BULK_ROLL_NUMBERS },
    });

    // track missing roll numbers
    const FOUND_ROLL_NUMBERS = EXISTED_STUDENTS.map((s) => s.rollNo);
    const MISSING_ROLL_NUMBERS = BULK_ROLL_NUMBERS.filter(
      (rn) => !FOUND_ROLL_NUMBERS.includes(rn)
    );
    NOT_FOUND_ROLL_NUMBERS.push(...MISSING_ROLL_NUMBERS);
    await Student.updateMany(
      { _id: { $in: EXISTED_STUDENTS.map((s) => s._id) } },
      { $addToSet: { kit: { $each: KIT_TO_ASSIGN } } }
    );

    console.log(
      `Kits assigned to ${EXISTED_STUDENTS.length} students. Not found roll numbers:`,
      NOT_FOUND_ROLL_NUMBERS
    );

    return res.status(200).json({
      message: "Bulk upload kits successful",
      EXISTED_KITS: EXISTED_KITS.map((k) => ({ id: k._id, name: k.name })),
      NOT_FOUND_ROLL_NUMBERS,
    });
  } catch (error) {
    console.error("Error in bulk upload kits:", error);
    res.status(500).json({
      error: "Bulk upload kits failed",
      details: error.message,
    });
  }
};

exports.bulkUploadInstallements = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res
        .status(400)
        .json({ error: "The uploaded Excel file is empty." });
    }

    const ROLL_NUMBERS = data
      .map((row) => Number(row["rollNumber"]))
      .filter((rn) => !isNaN(rn));

    const FEES = await Fee.find({ studentRollNo: { $in: ROLL_NUMBERS } });

    // not found roll numbers
    const FOUND_ROLL_NUMBERS = FEES.map((f) => f.studentRollNo);
    const NOT_FOUND_ROLL_NUMBERS = ROLL_NUMBERS.filter(
      (rn) => !FOUND_ROLL_NUMBERS.includes(rn)
    );

    let updatedDocs = new Set();

    for (const row of data) {
      const rollNumber = Number(row["rollNumber"]);
      const feeDoc = FEES.find((f) => Number(f.studentRollNo) === rollNumber);
      if (!feeDoc) continue;

      const parsedDate = parseDate(row["dateOfReceipt"]);

      const newSubmission = {
        amount: Number(row["amount"]) || 0,
        mode: row["mode"] || "N/A",
        dateOfReceipt:
          parsedDate && !isNaN(new Date(parsedDate))
            ? new Date(parsedDate)
            : null,
        receiptNumber: row["receiptNumber"] || "",
        UTR: row["UTR"] || "",
      };

      // Push submission into Fee model
      feeDoc.submissions.push(newSubmission);

      // Update fee amounts
      if (feeDoc.status !== "PAID") {
        feeDoc.paidAmount += newSubmission.amount;
        feeDoc.pendingAmount = Math.max(
          feeDoc.finalFees - feeDoc.paidAmount,
          0
        );
        feeDoc.status =
          feeDoc.pendingAmount === 0
            ? "PAID"
            : feeDoc.paidAmount === 0
            ? "UNPAID"
            : "PARTIAL";
      }

      updatedDocs.add(feeDoc._id.toString());
    }

    await Fee.bulkSave(FEES);

    return res.status(200).json({
      message: "Bulk upload submissions successful",
      updatedCount: updatedDocs.size,
      NOT_FOUND_ROLL_NUMBERS,
    });
  } catch (error) {
    console.error("Error in bulk upload installments:", error);
    res.status(500).json({
      error: "Bulk upload installments failed",
      details: error.message,
    });
  }
};
