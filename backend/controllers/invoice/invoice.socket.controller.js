import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from "../../services/invoice/invoice.services.js";

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

      // Ack to the creator if you want
      socket.emit("admin/invoices/create-response", { done: true });
    } catch (err) {
      socket.emit("admin/invoices/create-response", { done: false, error: err.message });
    }
  });

  // UPDATE
  socket.on("admin/invoices/update", async ({ invoiceId, updatedData }) => {
    try {
      authorize(socket, ["admin"]);
      const companyId = socket.companyId;
      await updateInvoice(companyId, invoiceId, updatedData);

      const data = await getInvoices(companyId, {});
      io.to(roomForCompany(companyId)).emit("admin/invoices/list-update", { done: true, data });

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

      socket.emit("admin/invoices/delete-response", { done: true });
    } catch (err) {
      socket.emit("admin/invoices/delete-response", { done: false, error: err.message });
    }
  });
};

export default invoiceSocketController;
