import express from "express";
import { createServer } from "http";
import cors from "cors";
import path from "path";
import fs from "fs";
import { config } from "dotenv";
import { connectDB } from "./config/db.js";
import { socketHandler } from "./socket/index.js";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname } from "path";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the temp directory
app.use('/temp', express.static(path.join(__dirname, 'temp'), {
  setHeaders: (res, path) => {
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'attachment');
  }
}));

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Connect to database
connectDB();

// Setup socket handlers
socketHandler(httpServer);

app.get("/", (req, res) => {
  res.send("API is running");
});

// Server Listen
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
