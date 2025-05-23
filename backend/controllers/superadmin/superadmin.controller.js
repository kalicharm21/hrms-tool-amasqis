import packageController from "./package.controller.js";

const modulefinder = (route) => {
  // Example: route might be "superadmin/packages/add-plan"
  // Extract the module part, e.g. "packages"
  const parts = route.split("/");
  return parts.length > 1 ? parts[1] : null;
};

const superAdminController = (route, role, socket, io, attachedModules) => {
  const module = modulefinder(route); // e.g., returns "packages"
  if (!module) return;

  if (!attachedModules.has(module)) {
    if (role === "superadmin" && module === "packages") {
      console.log("Attaching superadmin handlers for packages...");
      packageController(socket, io);
      attachedModules.add(module);
    }
  }
};

export default superAdminController;
