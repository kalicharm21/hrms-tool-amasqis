import { authenticateUser } from "../socialfeed/socialFeed.controller.js";
import { validateCompanyAccess } from "../socialfeed/validation.middleware.js";
import {
  createCompany,
  listCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
  exportCompanies,
} from "../../services/company/company.services.js";

export const companiesMiddleware = [authenticateUser, validateCompanyAccess];

export const CompaniesController = {
  create: async (req, res) => {
    try {
      const result = await createCompany(req.companyId, req.body || {});
      if (!result.done) return res.status(400).json(result);
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ done: false, error: e.message });
    }
  },
  list: async (req, res) => {
    try {
      const { page, limit, search, status, sortBy, sortOrder } = req.query;
      const result = await listCompanies(req.companyId, {
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
      const result = await getCompanyById(req.companyId, req.params.id);
      if (!result.done) return res.status(404).json(result);
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ done: false, error: e.message });
    }
  },
  update: async (req, res) => {
    try {
      const result = await updateCompany(req.companyId, req.params.id, req.body || {});
      if (!result.done) return res.status(400).json(result);
      return res.json(result);
    } catch (e) {
      return res.status(500).json({ done: false, error: e.message });
    }
  },
  remove: async (req, res) => {
    try {
      const result = await deleteCompany(req.companyId, req.params.id);
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

      const result = await exportCompanies(req.companyId, format);
      if (!result.done) return res.status(400).json(result);
      
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="companies.${format}"`);
      return res.send(result.data);
    } catch (e) {
      return res.status(500).json({ done: false, error: e.message });
    }
  },
};





