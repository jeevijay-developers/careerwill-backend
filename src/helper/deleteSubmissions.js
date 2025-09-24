const { connectDB, closeDBConnection } = require("../config/mongoDB");
const Fee = require("../models/Fee");

const deleteAllSubmissions = async (req, res) => {
  try {
    await connectDB(); // Ensure you have a function to connect to your database
    // Alternative: Set submissions to empty array instead of removing field
    const result = await Fee.updateMany({}, { $set: { submissions: [] } });
    console.log(`Submissions deleted from ${result.nModified} fee records.`);
  } catch (error) {
    console.error("Error deleting submissions:", error);
  } finally {
    closeDBConnection();
    console.log("Admin upload process completed.");
    process.exit(0); // Exit the process after adding admins
  }
};

deleteAllSubmissions();

// module.exports = {
//   deleteAllSubmissions,
//   // ...other existing functions
// };
