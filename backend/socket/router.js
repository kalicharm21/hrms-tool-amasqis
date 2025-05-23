import superAdminController from "../controllers/superadmin/superadmin.controller.js";

const router = (socket, io, role) => {
  const attachedModules = new Set(); // Track which modules are already attached

  socket.onAny((event, data) => {
    console.log(`[${socket.id}] Received event:`, event);

    if (!event.startsWith(`${role}/`)) return;

    // Pass socket, io, and attachedModules along with event and role
    superAdminController(event, role, socket, io, attachedModules);
  });
};

export default router;
