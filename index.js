import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import rootRouter from "./routes/Root.js";
import { connectDB } from "./config/Database.js";

dotenv.config();

const app = express();

const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json());

const port = process.env.PORT || 4000;

app.use("/api", rootRouter);

app.listen(port, () => {
  connectDB();
  console.log(`Server is running on port ${port}`);
});
