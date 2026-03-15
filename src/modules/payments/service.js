import pool from "../../config/db.js";

export const processPayment = async ({ sale_id, method, amount_paid }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const saleRes = await client.query(
      `SELECT total_amount, status
       FROM sales
       WHERE id = $1`,
      [sale_id],
    );

    const sale = saleRes.rows[0];

    if (!sale) {
      throw new Error("Sale not found");
    }

    if (sale.status !== "pending") {
      throw new Error("Sale already completed or cancelled");
    }

    const total = Number(sale.total_amount);

    if (amount_paid < total) {
      throw new Error("Insufficient payment");
    }

    const change = amount_paid - total;

    await client.query(
      `
      INSERT INTO payments (sale_id, method, amount)
      VALUES ($1,$2,$3)
      `,
      [sale_id, method, total],
    );

    await client.query(
      `
      UPDATE sales
      SET status='completed'
      WHERE id=$1
      `,
      [sale_id],
    );

    await client.query("COMMIT");

    return {
      sale_id,
      total,
      amount_paid,
      change,
      method,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
