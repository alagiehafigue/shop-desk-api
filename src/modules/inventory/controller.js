import {
  getLowStockProducts,
  restockProduct,
  adjustStock,
  getInventoryLogs,
} from "./service.js";

import { restockSchema, adjustmentSchema } from "./validation.js";

export const lowStock = async (req, res) => {
  const products = await getLowStockProducts();
  res.json(products);
};

export const restock = async (req, res) => {
  try {
    const data = restockSchema.parse(req.body);
    const result = await restockProduct(data);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const adjust = async (req, res) => {
  try {
    const data = adjustmentSchema.parse(req.body);
    const result = await adjustStock(data);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const logs = async (req, res) => {
  const result = await getInventoryLogs(req.params.product_id);
  res.json(result);
};
