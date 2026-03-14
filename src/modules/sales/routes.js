import express from "express";

import { create, receipt } from "./controller.js";

import { authenticate } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, create);
router.get("/:id/receipt", authenticate, receipt);

export default router;
