import {
  createCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  getCustomerSales,
} from "./service.js";

import { createCustomerSchema, updateCustomerSchema } from "./validation.js";

export const create = async (req, res) => {
  try {
    const data = createCustomerSchema.parse(req.body);
    const customer = await createCustomer(data);
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const list = async (req, res) => {
  const customers = await getCustomers();
  res.json(customers);
};

export const update = async (req, res) => {
  try {
    const data = updateCustomerSchema.parse(req.body);
    const result = await updateCustomer(req.params.id, data);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  const result = await deleteCustomer(req.params.id);
  res.json(result);
};

export const sales = async (req, res) => {
  const result = await getCustomerSales(req.params.id);
  res.json(result);
};
