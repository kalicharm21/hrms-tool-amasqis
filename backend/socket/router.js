import superAdminController from "../controllers/superadmin/superadmin.controller.js";
import adminController from "../controllers/admin/admin.controller.js";
import leadController from "../controllers/lead/lead.controller.js";
import clientController from "../controllers/client/client.controllers.js";
import activityController from "../controllers/activities/activities.controllers.js";

import userSocketController from "../controllers/user/user.socket.controller.js";

const router = (socket, io, role) => {
  console.log(`Setting up socket router for role: ${role}`);
  console.log(`Socket data:`, {
    id: socket.id,
    role: socket.role,
    companyId: socket.companyId,
    userMetadata: socket.userMetadata
  });

  switch (role) {
    case "superadmin":
      console.log("Attaching superadmin controller...");
      superAdminController(socket, io);
      break;
    case "admin":
      console.log("Attaching admin controller...");
      adminController(socket, io);
      console.log("Attaching lead controller for admin...");
      leadController(socket, io);
      console.log("Attaching client controller for admin...");
      clientController(socket, io);
      console.log("Attaching activity controller for admin...");
      activityController(socket, io);
      userSocketController(socket, io);
      break;
      
    case "hr":
      console.log("Attaching HR controller...");
      console.log("Attaching lead controller for hr...");
      leadController(socket, io);
      console.log("Attaching client controller for hr...");
      clientController(socket, io);
      console.log("Attaching activity controller for hr...");
      activityController(socket, io);
      userSocketController(socket, io);
      break;
    case "leads":
      console.log("Attaching leads controller...");
      leadController(socket, io);
      userSocketController(socket, io);
      break;
    case "employee":
      console.log("Employee controller not implemented yet");
      break;
    default:
      console.log(`No controller available for role: ${role}`);
      break;
  }

  socket.onAny((event, data) => {
    console.log(`[${socket.id}][${role}] Event: ${event}`);
  });
};

export default router;