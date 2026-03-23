import pool from "../../config/db.js";
import { simulateCardTerminalPayment } from "./cardSimulator.js";
import { simulateMtnMomoCollection } from "./mtnMomo.js";

export const processPayment = async ({
  sale_id,
  method,
  amount_paid,
  payer_phone,
  card_auth_code,
  card_holder_name,
  card_last4,
}) => {
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

    let momoMetadata = null;
    let cardMetadata = null;

    if (method === "momo") {
      if (!payer_phone) {
        throw new Error("Mobile Money payments require a payer phone number");
      }

      momoMetadata = await simulateMtnMomoCollection({
        amount: total,
        payerPhone: payer_phone,
        saleId: sale_id,
      });
    }

    if (method === "card") {
      cardMetadata = await simulateCardTerminalPayment({
        amount: total,
        authCode: card_auth_code,
        cardHolderName: card_holder_name,
        cardLast4: card_last4,
        saleId: sale_id,
      });
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
      card_approval_code: cardMetadata?.approvalCode ?? null,
      card_last4: cardMetadata?.cardLast4 ?? null,
      card_reference_id: cardMetadata?.referenceId ?? null,
      card_terminal_status: cardMetadata?.terminalStatus ?? null,
      momo_currency: momoMetadata?.currency ?? null,
      momo_reference_id: momoMetadata?.referenceId ?? null,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getPayments = async () => {
  const result = await pool.query(`
    SELECT
      p.id,
      p.sale_id,
      p.method,
      p.amount,
      p.created_at,
      s.total_amount,
      s.created_at AS sale_date,
      s.status,
      u.name AS cashier_name,
      c.name AS customer_name
    FROM payments p
    JOIN sales s ON s.id = p.sale_id
    LEFT JOIN users u ON u.id = s.user_id
    LEFT JOIN customers c ON c.id = s.customer_id
    ORDER BY p.created_at DESC
  `);

  return result.rows;
};

export const getPaymentSummary = async () => {
  const result = await pool.query(`
    SELECT
      method,
      COUNT(*) AS total_payments,
      SUM(amount) AS total_amount
    FROM payments
    GROUP BY method
    ORDER BY total_amount DESC
  `);

  return result.rows;
};

export const getPendingSales = async () => {
  const result = await pool.query(`
    SELECT
      s.id,
      s.total_amount,
      s.discount,
      s.tax,
      s.created_at,
      s.status,
      u.name AS cashier_name,
      c.name AS customer_name
    FROM sales s
    LEFT JOIN users u ON u.id = s.user_id
    LEFT JOIN customers c ON c.id = s.customer_id
    WHERE s.status = 'pending'
    ORDER BY s.created_at DESC
  `);

  return result.rows;
};
