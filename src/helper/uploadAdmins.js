const { connectDB, closeDBConnection } = require("../config/mongoDB");
const User = require("../models/User");
// require("dotenv").config();
const admins = [
  {
    username: "Super Admin", // String, required, unique
    password: "Super@123", // String, required (store hashed in real apps)
    role: "ADMIN", // One of: ADMIN, TEACHER, FRONTDDESK, ACCOUNTS, STORE
    email: "careerwillneet@gmail.com", // String, required, unique, lowercase
    phone: "9999999999", // String, optional
  },
  {
    username: "Front Desk Admin", // String, required, unique
    password: "FrontDesk@123", // String, required (store hashed in real apps)
    role: "FRONTDDESK", // One of: ADMIN, TEACHER, FRONTDDESK, ACCOUNTS, STORE
    email: "careerwillfrontdesk@gmail.com", // String, required, unique, lowercase
    phone: "1111111111", // String, optional
  },
  {
    username: "Accounts Admin", // String, required, unique
    password: "Accounts@123", // String, required (store hashed in real apps)
    role: "ACCOUNTS", // One of: ADMIN, TEACHER, FRONTDDESK, ACCOUNTS, STORE
    email: "cwparasjain@gmail.com", // String, required, unique, lowercase
    phone: "2458765321", // String, optional
  },
  {
    username: "Store Admin", // String, required, unique
    password: "Store@123", // String, required (store hashed in real apps)
    role: "STORE", // One of: ADMIN, TEACHER, FRONTDDESK, ACCOUNTS, STORE
    email: "cwstore@gmail.com", // String, required, unique, lowercase
    phone: "1478523698", // String, optional
  },
];

const addAdmins = async () => {
  await connectDB(); // Ensure you have a function to connect to your database
  try {
    for (const admin of admins) {
      const existingAdmin = await User.findOne({ email: admin.email });
      if (!existingAdmin) {
        const newAdmin = new User(admin);
        await newAdmin.save();
        console.log(`Admin ${admin.username} added successfully.`);
      } else {
        console.log(`Admin with email ${admin.email} already exists.`);
      }
    }
  } catch (error) {
    console.error("Error adding admins:", error);
  } finally {
    // Ensure you close the database connection if needed
    // await closeDBConnection(); // Uncomment if you have a function to close the connection
    closeDBConnection();
    console.log("Admin upload process completed.");
    process.exit(0); // Exit the process after adding admins
  }
};

addAdmins();
