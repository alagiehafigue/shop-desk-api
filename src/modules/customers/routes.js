import express from "express";

import { create, list, update, remove, sales } from "./controller.js";

import { authenticate } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, create);

router.get("/", authenticate, list);

router.patch("/:id", authenticate, update);

router.delete("/:id", authenticate, remove);

router.get("/:id/sales", authenticate, sales);

export default router;
