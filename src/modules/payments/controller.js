import {
  getPayments,
  getPaymentSummary,
  getPendingSales,
  processPayment,
} from "./service.js";
import { processPaymentSchema } from "./validation.js";

export const pay = async (req, res) => {
  try {
    const data = processPaymentSchema.parse(req.body);

    const result = await processPayment(data);

    res.json(result);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const list = async (req, res) => {
  const result = await getPayments();
  res.json(result);
};

export const summary = async (req, res) => {
  const result = await getPaymentSummary();
  res.json(result);
};

export const pendingSales = async (req, res) => {
  const result = await getPendingSales();
  res.json(result);
};
