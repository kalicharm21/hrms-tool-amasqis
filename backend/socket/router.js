import superadminHandlers from "../controllers/superadmin/package.controller.js";
import { modulefinder } from "../utils/modulefinder.js";

const router = (socket, io, role) => {
  const attachedModules = new Set(); // Track which modules are already attached

  socket.onAny((event, data) => {
    console.log(`[${socket.id}] Received event:`, event);

    if (!event.startsWith(`${role}/`)) return;

    const module = modulefinder(event); // e.g., returns "packages"

    // Only attach if not already handled
    if (!attachedModules.has(module)) {
      if (role === "superadmin" && module === "packages") {
        console.log("Attaching superadmin handlers for packages...");
        superadminHandlers(socket, io);
        attachedModules.add(module);
      }

      // Future: add other modules here if needed
      // if (role === "superadmin" && module === "somethingElse") { ... }
    }
  });
};

export default router;
