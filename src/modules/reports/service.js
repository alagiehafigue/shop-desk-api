import pool from "../../config/db.js";

// Daily Sales Report

export const getDailySales = async () => {
  const result = await pool.query(`
    SELECT
      DATE(created_at) AS date,
      COUNT(*) AS total_transactions,
      SUM(total_amount) AS total_sales
    FROM sales
    WHERE DATE(created_at) = CURRENT_DATE
    GROUP BY DATE(created_at)
  `);

  return result.rows;
};

// Weekly Sales Report

export const getWeeklySales = async () => {
  const result = await pool.query(`
    SELECT
      DATE(created_at) AS date,
      COUNT(*) AS transactions,
      SUM(total_amount) AS sales
    FROM sales
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  `);

  return result.rows;
};

// Product performance Record

export const getProductPerformance = async () => {
  const result = await pool.query(`
    SELECT
      p.id,
      p.name,
      SUM(si.quantity) AS total_sold,
      SUM(si.quantity * si.price) AS revenue
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    GROUP BY p.id, p.name
    ORDER BY total_sold DESC
  `);

  return result.rows;
};

// Inventory Report

export const getInventoryReport = async () => {
  const result = await pool.query(`
    SELECT
      id,
      name,
      price,
      stock_quantity
    FROM products
    ORDER BY stock_quantity ASC
  `);

  return result.rows;
};

// Cashier Sales Report

export const getCashierSales = async () => {
  const result = await pool.query(`
    SELECT
      u.id,
      u.name,
      COUNT(s.id) AS total_transactions,
      SUM(s.total_amount) AS total_sales
    FROM sales s
    JOIN users u ON s.user_id = u.id
    GROUP BY u.id, u.name
    ORDER BY total_sales DESC
  `);

  return result.rows;
};
