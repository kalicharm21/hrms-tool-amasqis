import express from "express";
import { ContactsController, contactsMiddleware } from "../controllers/contact/contact.controller.js";

const router = express.Router();

router.use(...contactsMiddleware);

router.get("/", ContactsController.list);
router.get("/export", ContactsController.export);
router.post("/", ContactsController.create);
router.get("/:id", ContactsController.getById);
router.put("/:id", ContactsController.update);
router.delete("/:id", ContactsController.remove);

export default router;