import pool from "../../config/db.js";

const LOW_STOCK_THRESHOLD = 10;

export const getLowStockProducts = async () => {
  const result = await pool.query(
    `
    SELECT id, name, stock_quantity
    FROM products
    WHERE stock_quantity <= $1
    ORDER BY stock_quantity ASC
    `,
    [LOW_STOCK_THRESHOLD],
  );

  return result.rows;
};

export const restockProduct = async ({ product_id, quantity }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE products
      SET stock_quantity = stock_quantity + $1
      WHERE id = $2
      `,
      [quantity, product_id],
    );

    await client.query(
      `
      INSERT INTO inventory_logs (product_id, change_type, quantity)
      VALUES ($1,'restock',$2)
      `,
      [product_id, quantity],
    );

    await client.query("COMMIT");

    return { message: "Product restocked successfully" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const adjustStock = async ({ product_id, quantity, reason }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE products
      SET stock_quantity = stock_quantity + $1
      WHERE id = $2
      `,
      [quantity, product_id],
    );

    await client.query(
      `
      INSERT INTO inventory_logs (product_id, change_type, quantity)
      VALUES ($1,$2,$3)
      `,
      [product_id, reason, quantity],
    );

    await client.query("COMMIT");

    return { message: "Stock adjusted successfully" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getInventoryLogs = async (product_id) => {
  const result = await pool.query(
    `
    SELECT *
    FROM inventory_logs
    WHERE product_id = $1
    ORDER BY created_at DESC
    `,
    [product_id],
  );

  return result.rows;
};
