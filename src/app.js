import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/routes.js";
import productRoutes from "./modules/products/routes.js";
import salesRoutes from "./modules/sales/routes.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/sales", salesRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "ShopDesk API running",
  });
});

export default app;
