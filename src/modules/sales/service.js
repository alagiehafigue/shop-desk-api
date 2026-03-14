import pool from "../../config/db.js";

export const createSale = async ({ user_id, data }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let totalAmount = 0;

    const saleItems = [];

    for (const item of data.items) {
      const productResult = await client.query(
        `SELECT id, price, stock_quantity FROM products WHERE id=$1 FOR UPDATE`,
        [item.product_id],
      );

      const product = productResult.rows[0];

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error("Insufficient stock");
      }

      const subtotal = Number(product.price) * item.quantity;

      totalAmount += subtotal;

      saleItems.push({
        product_id: product.id,
        quantity: item.quantity,
        price: product.price,
        subtotal,
      });

      const newStock = product.stock_quantity - item.quantity;

      await client.query(`UPDATE products SET stock_quantity=$1 WHERE id=$2`, [
        newStock,
        product.id,
      ]);

      await client.query(
        `
        INSERT INTO inventory_logs
        (product_id, change_type, quantity)
        VALUES ($1,'sale',$2)
        `,
        [product.id, -item.quantity],
      );
    }

    totalAmount = totalAmount - data.discount + data.tax;

    const saleResult = await client.query(
      `
      INSERT INTO sales
      (user_id, customer_id, total_amount, discount, tax)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [user_id, data.customer_id, totalAmount, data.discount, data.tax],
    );

    const sale = saleResult.rows[0];

    for (const item of saleItems) {
      await client.query(
        `
        INSERT INTO sale_items
        (sale_id, product_id, quantity, price, subtotal)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [sale.id, item.product_id, item.quantity, item.price, item.subtotal],
      );
    }

    await client.query(
      `
      INSERT INTO payments
      (sale_id, method, amount)
      VALUES ($1,$2,$3)
      `,
      [sale.id, data.payment_method, totalAmount],
    );

    await client.query("COMMIT");

    return {
      sale_id: sale.id,
      total: totalAmount,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};
