const { connectDB, closeDBConnection } = require("../config/mongoDB");
const Student = require("../models/Student");

const updateStatusToActive = async () => {
  try {
    await connectDB();
    await Student.updateMany(
      {},
      {
        status: "ACTIVE",
      }
    );
  } catch (error) {
    console.error("Error updating status to active:", error);
  } finally {
    await closeDBConnection();
    console.log("MongoDB connection closed after updating status.");
    process.exit(0); // Exit the process after update
  }
};

updateStatusToActive();
