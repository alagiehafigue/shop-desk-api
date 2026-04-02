import pool from "../../config/db.js";
import {
  buildPaystackReference,
  getPaystackCurrency,
  initializePaystackTransaction,
  verifyPaystackTransaction,
} from "./paystack.js";

async function getSaleForPayment(client, saleId) {
  const result = await client.query(
    `SELECT
       s.id,
       s.customer_id,
       s.total_amount,
       s.status,
       c.email AS customer_email,
       c.name AS customer_name,
       c.phone AS customer_phone,
       u.email AS cashier_email,
       u.name AS cashier_name,
       EXISTS (
         SELECT 1
         FROM payments
         WHERE sale_id = s.id
       ) AS has_payment
     FROM sales s
     LEFT JOIN customers c ON c.id = s.customer_id
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.id = $1`,
    [saleId],
  );

  return result.rows[0];
}

function assertPendingSale(sale) {
  if (!sale) {
    throw new Error("Sale not found");
  }

  if (sale.status !== "pending" || sale.has_payment) {
    throw new Error("Sale already paid or closed");
  }
}

function resolvePaystackEmail(sale) {
  return (
    sale.customer_email ||
    sale.cashier_email ||
    `sale-${sale.id.replace(/-/g, "")}@shopdesk.local`
  );
}

async function awardLoyaltyPoints(client, sale) {
  if (!sale.customer_id) {
    return;
  }

  const points = Math.floor(Number(sale.total_amount) / 10);

  await client.query(
    `
      UPDATE customers
      SET loyalty_points = loyalty_points + $1
      WHERE id = $2
    `,
    [points, sale.customer_id],
  );
}

function toMajorUnit(amount) {
  return Number(amount ?? 0);
}

function getExpectedChannel(method) {
  return method === "momo" ? "mobile_money" : "card";
}

function buildPaymentResult({
  amountPaid,
  change,
  method,
  saleId,
  total,
  transaction,
}) {
  return {
    sale_id: saleId,
    total,
    amount_paid: amountPaid,
    change,
    method,
    card_bank: transaction?.authorization?.bank ?? null,
    card_brand: transaction?.authorization?.brand ?? null,
    card_last4: method === "card" ? transaction?.authorization?.last4 ?? null : null,
    card_reference_id: method === "card" ? transaction?.reference ?? null : null,
    momo_currency: method === "momo" ? transaction?.currency ?? null : null,
    momo_reference_id: method === "momo" ? transaction?.reference ?? null : null,
    paystack_channel: transaction?.channel ?? null,
    paystack_currency: transaction?.currency ?? null,
    paystack_gateway_response: transaction?.gateway_response ?? null,
    paystack_paid_at: transaction?.paid_at ?? null,
    paystack_reference_id: transaction?.reference ?? null,
  };
}

export const initializePayment = async ({ sale_id, method, payer_phone }) => {
  const client = await pool.connect();

  try {
    const sale = await getSaleForPayment(client, sale_id);

    assertPendingSale(sale);

    const total = toMajorUnit(sale.total_amount);
    const reference = buildPaystackReference(sale_id);
    const channels = [getExpectedChannel(method)];
    const metadata = {
      cashier_name: sale.cashier_name,
      customer_name: sale.customer_name,
      payer_phone: payer_phone || sale.customer_phone || null,
      sale_id,
      source: "shopdesk",
    };

    const transaction = await initializePaystackTransaction({
      amount: total,
      channels,
      email: resolvePaystackEmail(sale),
      metadata,
      reference,
    });

    return {
      access_code: transaction.access_code,
      amount: total,
      authorization_url: transaction.authorization_url,
      currency: getPaystackCurrency(),
      method,
      reference: transaction.reference,
      sale_id,
    };
  } finally {
    client.release();
  }
};

export const processPayment = async ({
  sale_id,
  method,
  amount_paid,
  paystack_reference,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const sale = await getSaleForPayment(client, sale_id);

    assertPendingSale(sale);

    const total = toMajorUnit(sale.total_amount);
    let verifiedTransaction = null;
    let amountPaid = Number(amount_paid);
    let change = amountPaid - total;

    if (method === "cash") {
      if (amountPaid < total) {
        throw new Error("Insufficient payment");
      }
    } else {
      if (!paystack_reference) {
        throw new Error("Paystack reference is required for card and mobile money");
      }

      verifiedTransaction = await verifyPaystackTransaction(paystack_reference);

      if (verifiedTransaction.status !== "success") {
        throw new Error("Paystack payment is not successful");
      }

      const metadataSaleId = verifiedTransaction.metadata?.sale_id;

      if (metadataSaleId && metadataSaleId !== sale_id) {
        throw new Error("Paystack payment reference does not match this sale");
      }

      const verifiedAmount = Number(verifiedTransaction.amount ?? 0) / 100;

      if (Math.round(verifiedAmount * 100) !== Math.round(total * 100)) {
        throw new Error("Verified Paystack amount does not match the sale total");
      }

      if (
        verifiedTransaction.currency &&
        verifiedTransaction.currency.toUpperCase() !== getPaystackCurrency()
      ) {
        throw new Error("Paystack payment currency does not match this store");
      }

      const expectedChannel = getExpectedChannel(method);

      if (
        verifiedTransaction.channel &&
        verifiedTransaction.channel !== expectedChannel
      ) {
        throw new Error(
          `Paystack payment was completed with ${verifiedTransaction.channel}, expected ${expectedChannel}`,
        );
      }

      amountPaid = verifiedAmount;
      change = 0;
    }

    await awardLoyaltyPoints(client, sale);

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

    return buildPaymentResult({
      amountPaid,
      change,
      method,
      saleId: sale_id,
      total,
      transaction: verifiedTransaction,
    });
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
      AND NOT EXISTS (
        SELECT 1
        FROM payments p
        WHERE p.sale_id = s.id
      )
    ORDER BY s.created_at DESC
  `);

  return result.rows;
};
