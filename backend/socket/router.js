import superAdminController from "../controllers/superadmin/superadmin.controller.js";
import adminController from "../controllers/admin/admin.controller.js";
import invoiceSocketController from "../controllers/invoice/invoice.socket.controller.js";
import userSocketController from "../controllers/user/user.socket.controller.js";

const router = (socket, io, role) => {
  console.log(`Setting up socket router for role: ${role}`);


  switch (role) {
    case "superadmin":
      console.log("Attaching superadmin controller...");
      superAdminController(socket, io);
      break;
    case "admin":
      console.log("Attaching admin controller...");
      adminController(socket, io);
      invoiceSocketController(socket, io);
      userSocketController(socket, io);
      break;
      
    case "hr":
      console.log("Attaching HR controller...");
      invoiceSocketController(socket, io);
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