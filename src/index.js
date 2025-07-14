const express = require("express");
const connectDB = require("./config/mongoDB");
const dotenv = require("dotenv").config();
const authRoute = require("./router/AuthRouter");
const kitRoute = require("./router/kitRoutes");
const cors = require("cors");

const ORIGINS = [
  "http://localhost:3000",
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
  methods: ["GET", "POST", "PUT", "DELETE"],
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
