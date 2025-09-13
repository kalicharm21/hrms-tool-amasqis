import { getInvoices, createInvoice, updateInvoice, deleteInvoice, getInvoiceStats } from "../../services/invoice/invoice.services.js";


const authorize = (socket, allowed = []) => {
  const role = (socket.role || "").toLowerCase();
  if (!allowed.includes(role)) throw new Error("Forbidden");
};

const roomForCompany = (companyId) => `company:${companyId}`;

const invoiceSocketController = (socket, io) => {
  console.log(`✅ invoice.socket.controller active for ${socket.id}`);

  // Make sure socket is in its company room (if not already handled globally)
  if (socket.companyId) {
    socket.join(roomForCompany(socket.companyId));
  }

  // GET (with filters)
  socket.on("admin/invoices/get", async (filters = {}) => {
    try {
      authorize(socket, ["admin", "hr"]);
      const companyId = socket.companyId;
      const data = await getInvoices(companyId, filters);
      socket.emit("admin/invoices/get-response", { done: true, data });
    } catch (err) {
      socket.emit("admin/invoices/get-response", { done: false, error: err.message });
    }
  });

  // CREATE
  socket.on("admin/invoices/create", async (payload) => {
    try {
      authorize(socket, ["admin"]);
      const companyId = socket.companyId;
      await createInvoice(companyId, payload);

      // Re-emit fresh list to everyone in the same company
      const data = await getInvoices(companyId, {});
      io.to(roomForCompany(companyId)).emit("admin/invoices/list-update", { done: true, data });
      // after emitting list-update
        try {
          const newStats = await getInvoiceStats(companyId);
          io.to(roomForCompany(companyId)).emit("admin/invoices/stats-update", { done: true, data: newStats });
        } catch (e) {
          console.error("Failed to emit stats-update after create:", e);
        }

      // Ack to the creator if you want
      socket.emit("admin/invoices/create-response", { done: true });
    } catch (err) {
      socket.emit("admin/invoices/create-response", { done: false, error: err.message });
    }
  });

  // UPDATE
  // UPDATE
socket.on("admin/invoices/update", async ({ invoiceId, updatedData }) => {
  try {
    authorize(socket, ["admin"]);
    const companyId = socket.companyId;
    await updateInvoice(companyId, invoiceId, updatedData);

    const data = await getInvoices(companyId, {});
    io.to(roomForCompany(companyId)).emit("admin/invoices/list-update", { done: true, data });

    // 🔥 broadcast new stats
    try {
      const newStats = await getInvoiceStats(companyId);
      io.to(roomForCompany(companyId)).emit("admin/invoices/stats-update", { done: true, data: newStats });
    } catch (e) {
      console.error("Failed to emit stats-update after update:", e);
    }

    socket.emit("admin/invoices/update-response", { done: true });
  } catch (err) {
    socket.emit("admin/invoices/update-response", { done: false, error: err.message });
  }
});


  // DELETE (soft)
socket.on("admin/invoices/delete", async ({ invoiceId }) => {
  try {
    authorize(socket, ["admin"]);
    const companyId = socket.companyId;
    await deleteInvoice(companyId, invoiceId);

    const data = await getInvoices(companyId, {});
    io.to(roomForCompany(companyId)).emit("admin/invoices/list-update", { done: true, data });

    // 🔥 broadcast new stats
    try {
      const newStats = await getInvoiceStats(companyId);
      io.to(roomForCompany(companyId)).emit("admin/invoices/stats-update", { done: true, data: newStats });
    } catch (e) {
      console.error("Failed to emit stats-update after delete:", e);
    }

    socket.emit("admin/invoices/delete-response", { done: true });
  } catch (err) {
    socket.emit("admin/invoices/delete-response", { done: false, error: err.message });
  }
});


  // admin/invoices.js (or wherever your sockets are handled)
// inside invoiceSocketController function (after existing handlers)

/**
 * Stats (supports callback)
 * Client can call: socket.emit("admin/invoices/stats", null, (res) => { ... })
 * We also broadcast stats-update to all sockets in the company room when invoices change.
 */
socket.on("admin/invoices/stats", async (_, callback) => {
  try {
    authorize(socket, ["admin", "hr"]);
    const companyId = socket.companyId;
    if (!companyId) throw new Error("Company ID not found on socket.");

    const stats = await getInvoiceStats(companyId);

    if (typeof callback === "function") {
      callback({ done: true, data: stats });
    } else {
      socket.emit("admin/invoices/stats-response", { done: true, data: stats });
    }

  } catch (err) {
    console.error("Error in admin/invoices/stats:", err);
    if (typeof callback === "function") {
      callback({ done: false, error: err.message });
    } else {
      socket.emit("admin/invoices/stats-response", { done: false, error: err.message });
    }
  }
});

};

export default invoiceSocketController;
