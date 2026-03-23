import express from "express";
import { register, login, refresh, logout, me, listUsers } from "./controller.js";
import { authenticate } from "../../middlewares/authMiddleware.js";
import { authorize } from "../../middlewares/authorize.js";

const router = express.Router();

router.post("/register", authenticate, authorize("admin"), register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, me);
router.get("/users", authenticate, authorize("admin"), listUsers);

export default router;
