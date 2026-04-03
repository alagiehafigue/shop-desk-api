import express from "express";

import { create, receipt, getSale } from "./controller.js";

import { authenticate } from "../../middlewares/authMiddleware.js";
import { authorize } from "../../middlewares/authorize.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("admin", "manager", "cashier"),
  create,
);
router.get("/:id", authenticate, getSale);
router.get("/:id/receipt", authenticate, receipt);

export default router;
