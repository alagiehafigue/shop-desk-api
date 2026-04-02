import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { errorHandler } from "./middlewares/errorMiddleware.js";

import authRoutes from "./modules/auth/routes.js";
import productRoutes from "./modules/products/routes.js";
import inventoryRoutes from "./modules/inventory/routes.js";
import salesRoutes from "./modules/sales/routes.js";
import paymentRoutes from "./modules/payments/routes.js";
import customerRoutes from "./modules/customers/routes.js";
import reportRoutes from "./modules/reports/routes.js";

const app = express();
const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:5173",
];

function getAllowedOrigins() {
  const configuredOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...defaultAllowedOrigins, ...configuredOrigins])];
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  return getAllowedOrigins().includes(origin);
}

app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/sales", salesRoutes);
app.use("/payments", paymentRoutes);
app.use("/customers", customerRoutes);
app.use("/reports", reportRoutes);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "ShopDesk API running",
  });
});

// To catch for all Not Found Page
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.path}`);
  res.status(404);
  next(error); //
});

// To catch for all generic error
app.use(errorHandler);

export default app;
