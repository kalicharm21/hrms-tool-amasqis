import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import router from "./router.js";
import { clerkClient, verifyToken } from "@clerk/express";
dotenv.config();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://amasqis.ai",
  "https://devhrms-pm.amasqis.ai",
  "http://byte.localhost:3000",
  "http://test.localhost:3000",
  "http://dummy.localhost:3000",
];

// CORS AUTH Party - Clerk
const authorizedParties = [
  "https://devhrms-pm.amasqis.ai/",
  "http://localhost:3000",
  "http://185.199.53.177:5000/",
  "http://byte.localhost:3000",
  "http://test.localhost:3000",
  "http://dummy.localhost:3000",
];

export const socketHandler = (httpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  io.use(async (socket, next) => {
    console.log("🔄 Socket connection attempt...");
    const token = socket.handshake.auth.token;
    console.log(token);
    if (!token) {
      console.error("No token provided");
      return next(new Error("Authentication error: No token provided"));
    }
    try {
      console.log("process.env.CLERK_JWT_KEY", process.env.CLERK_JWT_KEY);
      console.log("Verifying token...");
      const verifiedToken = await verifyToken(token, {
        jwtKey: process.env.CLERK_JWT_KEY,
        authorizedParties: authorizedParties,
      });

      if (verifiedToken) {
        console.log(`✅ Token verified! User ID: ${verifiedToken.sub}`);
        socket.user = verifiedToken;
        const user = await clerkClient.users.getUser(verifiedToken.sub);
        const role = user.publicMetadata.role;
        socket.role = role;
        switch (role) {
          case "superadmin":
            socket.join("superadmin_room");
          // Add logics for multiple tenancy
        }
        return next();
      } else {
        console.error("Invalid token");
        return next(new Error("Authentication error: Invalid token"));
      }
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return next(new Error("Authentication error: Token verification failed"));
    }
  });
  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.id}`);
    const role = socket.role || "guest";
    router(socket, io, role);
    socket.on("disconnect", () => {
      console.log(`🔴 Client disconnected: ${socket.id}`);
    });
  });
};
