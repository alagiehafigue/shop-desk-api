import express from "express";
import { pay } from "./controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/pay", authenticate, pay);

export default router;
