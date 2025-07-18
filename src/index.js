const express = require("express");
const connectDB = require("./config/mongoDB");
const dotenv = require("dotenv").config();
const authRoute = require("./router/AuthRouter");
const kitRoute = require("./router/kitRoutes");
const studentRoute = require("./router/studentRoutes");
const batchRoute = require("./router/batchRoutes");
const feeRoute = require("./router/feeRoutes");
const bulkUploadRoutes = require("./router/bulkUploadRoutes");
const cors = require("cors");

const ORIGINS = [
  process.env.DEV_ENV,
  process.env.TEST_ENV,
  "https://careerwill-frontend.vercel.app",
  "https://careerwill-frontend-git-main-cw-ashishverma.vercel.app",
];
const app = express();
const PORT = process.env.PORT || 5000;
const CORS = {
  origin: (origin, callback) => {
    if (ORIGINS.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};
app.use(cors(CORS));
connectDB();
app.use(express.json());
app.use("/api/kit", kitRoute);
app.use("/api/student", studentRoute);
app.use("/api/batch", batchRoute);
app.use("/api/fee", feeRoute);
app.use("/api/bulk", bulkUploadRoutes);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.use("/api/auth", authRoute);

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
