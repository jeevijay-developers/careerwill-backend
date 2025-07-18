const xlsx = require("xlsx");
const mongoose = require("mongoose");
const { getAllSubjects } = require("../helper/Subject");
const TestScore = require("../models/TestScore");
exports.uploadTestScores = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  // Use a session for transactional integrity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // --- 1. Parse the Excel File ---
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

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
        father: row["Student Name"]?.toLowerCase().trim() || "N/A",
        batch: row["Batch"] || "N/A",
        percentile: row["Percentile"] || 0,
        total: row["Total"] || 0,
        rank: row["Test Rank"] || 0,
        subjects: [],
        date: row["Test Date"] ? new Date(row["Test Date"]) : new Date(),
      };
      // create subjects array from the row
      const subjects = getAllSubjects();
      for (const prop in row) {
        if (subjects.includes(`${prop}`)) {
          console.log(prop);
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
