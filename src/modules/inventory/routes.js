import express from "express";
import { lowStock, restock, adjust, logs } from "./controller.js";

import { authenticate } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/low-stock", authenticate, lowStock);

router.post("/restock", authenticate, restock);

router.post("/adjust", authenticate, adjust);

router.get("/logs/:product_id", authenticate, logs);

export default router;
