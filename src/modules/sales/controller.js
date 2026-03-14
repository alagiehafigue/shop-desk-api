import { createSale, getReceipt } from "./service.js";
import { createSaleSchema } from "./validation.js";

export const create = async (req, res) => {
  try {
    const data = createSaleSchema.parse(req.body);

    const result = await createSale({
      user_id: req.user.id,
      data,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const receipt = async (req, res) => {
  try {
    const receiptData = await getReceipt(req.params.id);

    res.json(receiptData);
  } catch (error) {
    res.status(404).json({
      message: error.message,
    });
  }
};
