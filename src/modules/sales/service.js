import pool from "../../config/db.js";

export const createSale = async ({
  user_id,
  customer_id,
  items,
  tax = 0,
  discount = 0,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let subtotal = 0;

    for (const item of items) {
      const productRes = await client.query(
        `SELECT price, stock_quantity 
         FROM products 
         WHERE id = $1`,
        [item.product_id],
      );

      const product = productRes.rows[0];

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error("Insufficient stock");
      }

      subtotal += product.price * item.quantity;
    }

    const total = subtotal + tax - discount;

    const saleRes = await client.query(
      `
      INSERT INTO sales (user_id, customer_id, total_amount, discount, tax, status)
      VALUES ($1,$2,$3,$4,$5,'pending')
      RETURNING *
      `,
      [user_id, customer_id, total, discount, tax],
    );

    const sale = saleRes.rows[0];

    for (const item of items) {
      const productRes = await client.query(
        `SELECT price FROM products WHERE id=$1`,
        [item.product_id],
      );

      const price = productRes.rows[0].price;
      const subtotal = price * item.quantity;

      await client.query(
        `
        INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [sale.id, item.product_id, item.quantity, price, subtotal],
      );

      await client.query(
        `
        UPDATE products
        SET stock_quantity = stock_quantity - $1
        WHERE id = $2
        `,
        [item.quantity, item.product_id],
      );
    }

    await client.query("COMMIT");

    return sale;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getReceipt = async (saleId) => {
  const saleResult = await pool.query(
    `
    SELECT 
      s.id,
      s.created_at,
      s.total_amount,
      s.discount,
      s.tax,
      u.name as cashier,
      p.method as payment_method
    FROM sales s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN payments p ON p.sale_id = s.id
    WHERE s.id = $1
    `,
    [saleId],
  );

  const sale = saleResult.rows[0];

  if (!sale) {
    throw new Error("Sale not found");
  }

  const itemsResult = await pool.query(
    `
    SELECT
      si.quantity,
      si.price,
      si.subtotal,
      pr.name
    FROM sale_items si
    JOIN products pr ON si.product_id = pr.id
    WHERE si.sale_id = $1
    `,
    [saleId],
  );

  const items = itemsResult.rows;

  return {
    store: "ShopDesk POS",
    transaction_id: sale.id,
    date: sale.created_at,
    cashier: sale.cashier,
    payment_method: sale.payment_method,
    discount: sale.discount,
    tax: sale.tax,
    total: sale.total_amount,
    items,
  };
};
