import { processPayment } from "./service.js";
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
