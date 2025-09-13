import express from "express";
import { CompaniesController, companiesMiddleware } from "../controllers/company/company.controller.js";

const router = express.Router();

router.use(...companiesMiddleware);

router.get("/", CompaniesController.list);
router.get("/export", CompaniesController.export);
router.post("/", CompaniesController.create);
router.get("/:id", CompaniesController.getById);
router.put("/:id", CompaniesController.update);
router.delete("/:id", CompaniesController.remove);

export default router;





