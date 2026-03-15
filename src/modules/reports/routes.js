import express from "express";

import {
  dailySales,
  weeklySales,
  productPerformance,
  inventoryReport,
  cashierSales,
} from "./controller.js";

import { authenticate } from "../../middlewares/authMiddleware.js";
import { authorize } from "../../middlewares/authorize.js";

const router = express.Router();

router.get(
  "/daily-sales",
  authenticate,
  authorize("admin", "manager"),
  dailySales,
);

router.get(
  "/weekly-sales",
  authenticate,
  authorize("admin", "manager"),
  weeklySales,
);

router.get(
  "/product-performance",
  authenticate,
  authorize("admin", "manager"),
  productPerformance,
);

router.get(
  "/inventory",
  authenticate,
  authorize("admin", "manager"),
  inventoryReport,
);

router.get(
  "/cashier-sales",
  authenticate,
  authorize("admin", "manager"),
  cashierSales,
);

export default router;
