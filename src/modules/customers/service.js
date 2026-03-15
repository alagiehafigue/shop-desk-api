import pool from "../../config/db.js";

export const createCustomer = async ({ name, phone, email }) => {
  const result = await pool.query(
    `
    INSERT INTO customers (name, phone, email)
    VALUES ($1,$2,$3)
    RETURNING *
    `,
    [name, phone, email],
  );

  return result.rows[0];
};

export const getCustomers = async () => {
  const result = await pool.query(
    `
    SELECT *
    FROM customers
    ORDER BY created_at DESC
    `,
  );

  return result.rows;
};

export const updateCustomer = async (id, data) => {
  const fields = [];
  const values = [];
  let index = 1;

  for (const key in data) {
    fields.push(`${key}=$${index}`);
    values.push(data[key]);
    index++;
  }

  values.push(id);

  const result = await pool.query(
    `
    UPDATE customers
    SET ${fields.join(",")}
    WHERE id=$${index}
    RETURNING *
    `,
    values,
  );

  return result.rows[0];
};

export const deleteCustomer = async (id) => {
  await pool.query(
    `
    DELETE FROM customers
    WHERE id=$1
    `,
    [id],
  );

  return { message: "Customer deleted" };
};

export const getCustomerSales = async (customer_id) => {
  const result = await pool.query(
    `
    SELECT
      s.id,
      s.total_amount,
      s.created_at
    FROM sales s
    WHERE s.customer_id=$1
    ORDER BY s.created_at DESC
    `,
    [customer_id],
  );

  return result.rows;
};
