const express = require("express");
const connectDB = require("./config/mongoDB");
const dotenv = require("dotenv").config();
const authRoute = require("./router/AuthRouter");
const kitRoute = require("./router/kitRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
connectDB();
app.use(express.json());
app.use("/api/kit", kitRoute);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.use("/api/auth", authRoute);

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
