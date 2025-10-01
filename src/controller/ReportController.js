const Student = require("../models/Student");
const Fee = require("../models/Fee");
const Batch = require("../models/Batch");
const Attendance = require("../models/Attendance");
const TestScore = require("../models/TestScore");
const XLSX = require("xlsx");

// Utility: simple JSON -> CSV (no external lib)
function toCSV(rows, fields) {
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const header = fields.join(",");
  const body = rows
    .map((r) => fields.map((f) => esc(r[f])).join(","))
    .join("\n");
  return header + "\n" + body;
}

// GET /api/report/summary
exports.getSummaryReport = async (req, res) => {
  try {
    // 1. Total number of students
    const totalStudents = await Student.countDocuments();

    // 2. Total students batch-wise
    const batchWise = await Student.aggregate([
      { $group: { _id: "$batch", count: { $sum: 1 } } },
    ]);

    // 3. Total revenue (sum of all finalFees)
    const totalRevenueAgg = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: "$finalFees" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // 4. Total collected (sum of all paidAmount)
    const totalCollectedAgg = await Fee.aggregate([
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]);
    const totalCollected = totalCollectedAgg[0]?.total || 0;

    // (Removed) Roll no wise fee deposit and due status per request.

    // 6 & 7. Attendance: present/absent students date-wise (and weekly)
    const attendanceAgg = await Attendance.aggregate([
      {
        $group: {
          _id: { date: "$date", presentStatus: "$presentStatus" },
          count: { $sum: 1 },
        },
      },
    ]).limit(10);
    // Format attendance by date
    const attendanceByDate = {};
    attendanceAgg.forEach((rec) => {
      const date = rec._id.date.toISOString().slice(0, 10);
      if (!attendanceByDate[date])
        attendanceByDate[date] = { present: 0, absent: 0 };
      if (rec._id.presentStatus === "P")
        attendanceByDate[date].present += rec.count;
      else attendanceByDate[date].absent += rec.count;
    });
    // Weekly summary
    const weekAttendance = {};
    Object.entries(attendanceByDate).forEach(([date, val]) => {
      const week = new Date(date);
      const weekKey = `${week.getFullYear()}-W${Math.ceil(
        (week.getDate() + 6 - week.getDay()) / 7
      )}`;
      if (!weekAttendance[weekKey])
        weekAttendance[weekKey] = { present: 0, absent: 0 };
      weekAttendance[weekKey].present += val.present;
      weekAttendance[weekKey].absent += val.absent;
    });

    // 9. Test attendance (present/absent in test)
    // Assumption: A student is 'present' if a TestScore record exists for that date (optionally filtered by batch).
    // Absent = total students (or batch students) - present count for that date.
    const batchFilter = req.query.batch
      ? { batch: req.query.batch.toLowerCase() }
      : {};

    // Count students for reference (overall or within batch if provided)
    const totalStudentsRef = req.query.batch
      ? await Student.countDocuments({ batch: req.query.batch })
      : totalStudents;

    const testAttendanceSummary = await TestScore.aggregate([
      { $match: batchFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          presentRolls: { $addToSet: "$rollNumber" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          present: { $size: "$presentRolls" },
        },
      },
      { $sort: { date: 1 } },
    ]);

    testAttendanceSummary.forEach((d) => {
      d.absent = Math.max(totalStudentsRef - d.present, 0);
    });

    // 8. Report download option (CSV / Excel) now exports summary only
    if (req.query.download === "csv" || req.query.download === "excel") {
      const summaryRows = [];
      batchWise.forEach((b) => {
        summaryRows.push({
          section: "batch",
          batch: b._id || "N/A",
          students: b.count,
        });
      });
      summaryRows.push({
        section: "financial",
        metric: "totalRevenue",
        value: totalRevenue,
      });
      summaryRows.push({
        section: "financial",
        metric: "totalCollected",
        value: totalCollected,
      });
      // Simple attendance totals (sum across all dates)
      const totalPresent = Object.values(attendanceByDate).reduce(
        (a, v) => a + v.present,
        0
      );
      const totalAbsent = Object.values(attendanceByDate).reduce(
        (a, v) => a + v.absent,
        0
      );
      summaryRows.push({
        section: "attendance",
        metric: "present",
        value: totalPresent,
      });
      summaryRows.push({
        section: "attendance",
        metric: "absent",
        value: totalAbsent,
      });

      if (req.query.download === "csv") {
        const csv = toCSV(
          summaryRows,
          Object.keys(summaryRows[0] || { section: "info" })
        );
        res.header("Content-Type", "text/csv");
        res.attachment("reportSummary.csv");
        return res.send(csv);
      } else {
        const ws = XLSX.utils.json_to_sheet(summaryRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Summary");
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        res.header(
          "Content-Disposition",
          "attachment; filename=reportSummary.xlsx"
        );
        res.header(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        return res.send(buf);
      }
    }

    res.json({
      totalStudents,
      batchWise,
      totalRevenue,
      totalCollected,
      attendanceByDate,
      weekAttendance,
      testAttendance: testAttendanceSummary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
