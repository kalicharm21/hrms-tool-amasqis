import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import { socketHandler } from "./socket/index.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();
const server = createServer(app);
app.use(cors());
app.use(express.json());
console.log("Connecting DB");
connectDB();
socketHandler(server);

app.get("/", (req, res) => {
  res.send("HRMS Socket Server is running...");
});

// Server Listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
