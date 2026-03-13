import express from "express";
import { register, login, refresh, logout, me } from "./controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);

export default router;
