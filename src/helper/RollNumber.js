const Student = require("../models/Student");

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
