import express from "express";
import { initialize, list, pay, pendingSales, summary } from "./controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, list);
router.get("/summary", authenticate, summary);
router.get("/pending-sales", authenticate, pendingSales);
router.post("/initialize", authenticate, initialize);
router.post("/pay", authenticate, pay);

export default router;
