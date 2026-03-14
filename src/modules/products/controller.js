import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "./service.js";

import { createProductSchema, updateProductSchema } from "./validation.js";

export const create = async (req, res) => {
  try {
    const data = createProductSchema.parse(req.body);

    const product = await createProduct(data);

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const list = async (req, res) => {
  const products = await getProducts();

  res.json(products);
};

export const getOne = async (req, res) => {
  const product = await getProductById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};

export const update = async (req, res) => {
  try {
    const data = updateProductSchema.parse(req.body);

    const product = await updateProduct(req.params.id, data);

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  await deleteProduct(req.params.id);

  res.json({ message: "Product deleted" });
};
