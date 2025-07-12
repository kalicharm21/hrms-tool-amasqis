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
    console.log("Socket connection attempt...");
    const token = socket.handshake.auth.token;
    if (!token) {
      console.error("No token provided");
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const verifiedToken = await verifyToken(token, {
        jwtKey: process.env.CLERK_JWT_KEY,
        authorizedParties,
      });

      if (verifiedToken) {
        console.log(`Token verified! User ID: ${verifiedToken.sub}`);
        socket.user = verifiedToken;

        const user = await clerkClient.users.getUser(verifiedToken.sub);

        // Check if role exists, else assign default role based on metadata
        let role = user.publicMetadata?.role;
        let companyId = user.publicMetadata?.companyId || null;

        if (!role) {
          // If no role is set, assign based on whether they have a companyId
          if (companyId) {
            role = "admin"; // If they have a companyId, they're an admin
          } else {
            role = "public"; // Otherwise, they're public
          }

          await clerkClient.users.updateUserMetadata(user.id, {
            publicMetadata: { ...user.publicMetadata, role },
          });
          console.log(`Default role '${role}' assigned to user ${user.id}`);
        } else {
          console.log(`Existing role: ${role}`);
        }

        socket.role = role;
        socket.companyId = companyId;

        console.log(`Company ID: ${companyId || "None"}`);

        // Join role-based rooms
        switch (role) {
          case "superadmin":
            socket.join("superadmin_room");
            console.log(`User joined superadmin_room`);
            break;
          case "admin":
            if (companyId) {
              socket.join(`admin_room_${companyId}`);
              console.log(`User joined admin_room_${companyId}`);
            } else {
              console.warn(`Admin user ${user.id} has no companyId`);
              return next(new Error("Admin user must have a companyId"));
            }
            break;
          case "hr":
            if (companyId) {
              socket.join(`hr_room_${companyId}`);
              console.log(`User joined hr_room_${companyId}`);
            }
            break;
          case "employee":
            if (companyId) {
              socket.join(`employee_room_${companyId}`);
              console.log(`User joined employee_room_${companyId}`);
            }
            break;
          default:
            console.log(`User with role '${role}' connected`);
            break;
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
    console.log(
      `Client connected: ${socket.id}, Role: ${socket.role}, Company: ${
        socket.companyId || "None"
      }`
    );
    const role = socket.role || "guest";
    router(socket, io, role);

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};
