import packageController from "./package.controller.js";
import companiesController from "./companies.controller.js";
import subscriptionsController from "./subscription.controller.js";
import dashboardController from "./dashboard.controller.js";

const superAdminController = (socket, io) => {
  console.log("Setting up superadmin controllers...");

  // Attach all superadmin controllers immediately
  console.log("Attaching superadmin packages controller...");
  packageController(socket, io);

  console.log("Attaching superadmin companies controller...");
  companiesController(socket, io);

  console.log("Attaching superadmin dashboard controller...");
  dashboardController(socket, io);

  console.log("Attaching superadmin subscriptions controller...");
  subscriptionsController(socket, io);
};

export default superAdminController;
