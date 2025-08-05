const Student = require("../models/Student");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

exports.getNumericRollNumbers = async (req, res) => {
  try {
    const suggestionCount = 3;
    const min = 1;
    const max = 9999999;

    const availableRollNumbers = new Set();

    while (availableRollNumbers.size < suggestionCount) {
      const roll = Math.floor(Math.random() * (max - min + 1)) + min;
      const rollStr = roll.toString();

      const exists = await Student.exists({ rollNo: rollStr });
      if (!exists) {
        availableRollNumbers.add(rollStr);
      }
    }

    return availableRollNumbers;
  } catch (err) {
    console.error("Error generating roll numbers:", err);
    return new Error("Error generating roll numbers");
  }
};

exports.generateOTP = () => Math.floor(100000 + Math.random() * 900000);

exports.formatUserDate = (inputDate, outputFormat = "YYYY-MM-DD") => {
  const parsedDate = dayjs(inputDate);
  if (!parsedDate.isValid()) {
    return null;
  }
  return parsedDate.format(outputFormat);
};

/**
 * Parses any user-provided date string and returns
 * a JavaScript Date object set to T00:00:00Z (UTC).
 * Returns null if the input is invalid.
 */
exports.parseDate = (inputDate) => {
  const parsed = dayjs.utc(inputDate);
  return parsed.isValid() ? parsed.toDate() : null;
};
