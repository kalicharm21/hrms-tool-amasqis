import dashboardController from "./dashboard.controller.js";
import notesController from "./notes.controller.js";

const employeeController = (socket, io) => {
  console.log("Setting up employee controllers...");

  // Attach all superadmin controllers immediately
  console.log("Attaching employee dashboard controller...");
  dashboardController(socket, io);

  console.log("Attaching employee notes controller...");
  notesController(socket, io);

};

export default employeeController;
