import {
  getDailySales,
  getWeeklySales,
  getProductPerformance,
  getInventoryReport,
  getCashierSales,
} from "./service.js";

export const dailySales = async (req, res) => {
  const result = await getDailySales();
  res.json(result);
};

export const weeklySales = async (req, res) => {
  const result = await getWeeklySales();
  res.json(result);
};

export const productPerformance = async (req, res) => {
  const result = await getProductPerformance();
  res.json(result);
};

export const inventoryReport = async (req, res) => {
  const result = await getInventoryReport();
  res.json(result);
};

export const cashierSales = async (req, res) => {
  const result = await getCashierSales();
  res.json(result);
};
