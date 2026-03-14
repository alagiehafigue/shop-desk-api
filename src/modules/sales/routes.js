import express from "express";

import { create } from "./controller.js";

import { authenticate } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, create);

export default router;
