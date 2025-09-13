import { authenticateUser } from "../socialfeed/socialFeed.controller.js";
import { validateCompanyAccess } from "../socialfeed/validation.middleware.js";
import {
  createContact,
  listContacts,
  getContactById,
  updateContact,
  deleteContact,
  exportContacts,
} from "../../services/contact/contact.services.js";

export const contactsMiddleware = [authenticateUser, validateCompanyAccess];

export const ContactsController = {
  create: async (req, res) => {
    try {
      const result = await createContact(req.contactId, req.body || {});
      if (!result.done) return res.status(400).json(result);
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ done: false, error: e.message });
    }
  },
  list: async (req, res) => {
    try {
      const { page, limit, search, status, sortBy, sortOrder } = req.query;
      const result = await listContacts(req.contactId, {
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder,
      });
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ done: false, error: e.message });
    }
  },
  getById: async (req, res) => {
    try {
      const result = await getContactById(req.contactId, req.params.id);
      if (!result.done) return res.status(404).json(result);
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ done: false, error: e.message });
    }
  },
  update: async (req, res) => {
    try {
      const result = await updateContact(req.contactId, req.params.id, req.body || {});
      if (!result.done) return res.status(400).json(result);
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ done: false, error: e.message });
    }
  },
  remove: async (req, res) => {
    try {
      const result = await deleteContact(req.contactId, req.params.id);
      if (!result.done) return res.status(404).json(result);
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ done: false, error: e.message });
    }
  },
  export: async (req, res) => {
    try {
      const { format } = req.query;
      if (!format || !['pdf', 'excel'].includes(format)) {
        return res.status(400).json({
          done: false,
          error: "Invalid format. Supported formats: pdf, excel"
        });
      }

      const result = await exportContacts(req.contactId, format);
      if (!result.done) return res.status(400).json(result);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="contacts.${format}"`);
      return res.send(result.data);
    } catch (e) {
      return res.status(500).json({ done: false, error: e.message });
    }
  },
};