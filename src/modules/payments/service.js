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

    const saleInfo = await client.query(
      `
  SELECT customer_id, total_amount
  FROM sales
  WHERE id=$1
  `,
      [sale_id],
    );

    const { customer_id, total_amount } = saleInfo.rows[0];

    if (customer_id) {
      const points = Math.floor(total_amount / 10);

      await client.query(
        `
    UPDATE customers
    SET loyalty_points = loyalty_points + $1
    WHERE id = $2
    `,
        [points, customer_id],
      );
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
