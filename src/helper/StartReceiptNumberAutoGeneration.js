const { connectDB, closeDBConnection } = require("../config/mongoDB");
const ReceiptCounter = require("../models/ReceiptCounter");

const startReceiptNumberAutoGeneration = async () => {
  try {
    await connectDB();
    const rec = new ReceiptCounter({
      id: 1, // Unique identifier for the receipt counter
      counter: 100000, // Starting receipt number for auto generation
    });
    await rec.save();
    console.log(
      "Receipt number auto generation started with initial counter set to 100000."
    );
  } catch (error) {
    console.error("Error starting receipt number auto generation:", error);
  } finally {
    await closeDBConnection();
    console.log(
      "MongoDB connection closed after starting receipt number generation."
    );
    process.exit(0); // Exit the process after setup
  }
};

startReceiptNumberAutoGeneration();
