import express from "express";

import {
  create,
  list,
  getOne,
  update,
  remove,
  getByBarcode,
} from "./controller.js";

import { authenticate } from "../../middlewares/authMiddleware.js";
import { authorize } from "../../middlewares/authorize.js";

const router = express.Router();

router.post("/", authenticate, authorize("admin", "manager"), create);
router.get("/", authenticate, list);
router.get("/:id", authenticate, getOne);
router.get("/barcode/:barcode", authenticate, getByBarcode);
router.patch("/:id", authenticate, update);
router.delete("/:id", authenticate, remove);

export default router;
