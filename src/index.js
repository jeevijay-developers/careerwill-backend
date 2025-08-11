const express = require("express");
const connectDB = require("./config/mongoDB");
const dotenv = require("dotenv").config();
const authRoute = require("./router/AuthRouter");
const kitRoute = require("./router/kitRoutes");
const studentRoute = require("./router/studentRoutes");
const batchRoute = require("./router/batchRoutes");
const feeRoute = require("./router/feeRoutes");
const bulkUploadRoutes = require("./router/bulkUploadRoutes");
const testScoreRoutes = require("./router/testScoreRoutes");
const userRolesRoutes = require("./router/userRoutes");
const cors = require("cors");

const ORIGINS = [
  process.env.DEV_ENV,
  process.env.TEST_ENV,
  process.env.PARENT_LOCAL,
  process.env.PARENT_DEV,
  "https://careerwill-frontend.vercel.app",
  "https://careerwill-frontend-git-main-cw-ashishverma.vercel.app",
];
const app = express();
const PORT = process.env.PORT || 5000;
const CORS = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};
app.use(cors(CORS));
connectDB();
app.use(express.json());
app.use("/api/kit", kitRoute);
app.use("/api/student", studentRoute);
app.use("/api/batch", batchRoute);
app.use("/api/fee", feeRoute);
app.use("/api/bulk", bulkUploadRoutes);
app.use("/api/auth", authRoute);
app.use("/api/test-score", testScoreRoutes);
app.use("/api/user-roles", userRolesRoutes);
app.post("/", async (req, res) => {
  const { request_code } = req.headers;

  // if (request_code === 'realtime_glog') {
  //   // Section 4.1 - Real-time log received
  //   const log = req.body;
  //   await saveLogToMongoDB(log);
  //   res.set('response_code', 'OK');
  //   res.set('trans_id', '100');
  //   return res.status(200).send();
  // }

  // if (request_code === 'receive_cmd') {
  //   // Section 2.5 - Device is polling for new commands
  //   res.set('response_code', 'ERROR_NO_CMD');
  //   return res.status(200).send();
  // }
  console.log("Unknown request received:", req.headers);
  console.log("Request body:", req.body);
  res.set("response_code", "ERROR_UNKNOWN_REQUEST");

  return res.status(400).send("Unknown request");
});

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
