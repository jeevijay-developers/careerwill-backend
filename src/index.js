const express = require("express");
const connectDB = require("./config/mongoDB");
const dotenv = require("dotenv");
const authRoute = require("./router/AuthRouter");
const kitRoute = require("./router/kitRoutes");
const cors = require("cors");
dotenv.config();
const ORIGINS = [
  process.env.TEST_ENV,
  process.env.DEV_ENV,
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

app.get("/", (req, res) => {
  res.send("Hello");
});

app.use("/api/auth", authRoute);

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
