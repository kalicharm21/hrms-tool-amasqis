import packageController from "./package.controller.js";
import companiesController from "./companies.controller.js";
import subscriptionsController from "./subscription.controller.js";
import dashboardController from "./dashboard.controller.js";

const modulefinder = (route) => {
  // Example: route might be "superadmin/packages/add-plan"
  // Extract the module part, e.g. "packages"
  const parts = route.split("/");
  return parts.length > 1 ? parts[1] : null;
};

const superAdminController = (route, role, socket, io, attachedModules) => {
  socket.join("superadmin_room");
  const module = modulefinder(route); // e.g., returns "packages"
  if (!module) return;
  if (!attachedModules.has(module)) {
    if (module === "packages") {
      console.log("Attaching superadmin handlers for packages...");
      packageController(socket, io);
      attachedModules.add(module);
    } else if (module === "companies") {
      console.log("Attaching superadmin handlers for companies...");
      companiesController(socket, io);
      attachedModules.add(module);
    } else if (module === "dashboard") {
      console.log("Attaching superadmin handlers for dashboard...");
      dashboardController(socket, io);
      attachedModules.add(module);
    } else if (module === "subscriptions") {
      console.log("Attaching superadmin handlers for Subscription...");
      subscriptionsController(socket, io);
      attachedModules.add(module);
    }
  }
};

export default superAdminController;
