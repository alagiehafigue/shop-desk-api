import pool from "../../config/db.js";

export const createProduct = async (data) => {
  const result = await pool.query(
    `
    INSERT INTO products
    (name, category, barcode, price, cost_price, stock_quantity)
    VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *
    `,
    [
      data.name,
      data.category,
      data.barcode,
      data.price,
      data.cost_price,
      data.stock_quantity ?? 0,
    ],
  );

  return result.rows[0];
};

export const getProducts = async () => {
  const result = await pool.query(
    `SELECT * FROM products ORDER BY created_at DESC`,
  );

  return result.rows;
};

export const getProductById = async (id) => {
  const result = await pool.query(`SELECT * FROM products WHERE id=$1`, [id]);

  return result.rows[0];
};

export const updateProduct = async (id, data) => {
  const result = await pool.query(
    `
    UPDATE products
    SET
      name = COALESCE($1, name),
      category = COALESCE($2, category),
      barcode = COALESCE($3, barcode),
      price = COALESCE($4, price),
      cost_price = COALESCE($5, cost_price),
      stock_quantity = COALESCE($6, stock_quantity),
      updated_at = CURRENT_TIMESTAMP
    WHERE id=$7
    RETURNING *
    `,
    [
      data.name,
      data.category,
      data.barcode,
      data.price,
      data.cost_price,
      data.stock_quantity,
      id,
    ],
  );

  return result.rows[0];
};

export const deleteProduct = async (id) => {
  await pool.query(`DELETE FROM products WHERE id=$1`, [id]);

  return true;
};
