import express from "express";

import { create, list, getOne, update, remove } from "./controller.js";

import { authenticate } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authenticate, create);
router.get("/", authenticate, list);
router.get("/:id", authenticate, getOne);
router.patch("/:id", authenticate, update);
router.delete("/:id", authenticate, remove);

export default router;
