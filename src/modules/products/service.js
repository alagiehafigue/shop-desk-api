import pool from "../../config/db.js";

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function ensureBarcodeIsAvailable(barcode, excludedProductId = null) {
  if (!barcode) {
    return;
  }

  const existingProduct = await getProductByBarcode(barcode);

  if (!existingProduct) {
    return;
  }

  if (excludedProductId && String(existingProduct.id) === String(excludedProductId)) {
    return;
  }

  throw createServiceError("Barcode is already assigned to another product", 409);
}

export const createProduct = async (data) => {
  await ensureBarcodeIsAvailable(data.barcode);

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
  await ensureBarcodeIsAvailable(data.barcode, id);

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

export const getProductByBarcode = async (barcode) => {
  const result = await pool.query(`SELECT * FROM products WHERE barcode=$1`, [
    barcode,
  ]);

  return result.rows[0];
};

export const logInventoryChange = async ({
  product_id,
  change_type,
  quantity,
  reference_id,
}) => {
  await pool.query(
    `
    INSERT INTO inventory_logs
    (product_id, change_type, quantity, reference_id)
    VALUES ($1,$2,$3,$4)
    `,
    [product_id, change_type, quantity, reference_id],
  );
};

export const updateStock = async ({
  product_id,
  quantity_change,
  change_type,
  reference_id,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const productResult = await client.query(
      `
      SELECT stock_quantity
      FROM products
      WHERE id=$1
      FOR UPDATE
      `,
      [product_id],
    );

    const product = productResult.rows[0];

    if (!product) {
      throw new Error("Product not found");
    }

    const newStock = product.stock_quantity + quantity_change;

    if (newStock < 0) {
      throw new Error("Insufficient stock");
    }

    await client.query(
      `
      UPDATE products
      SET stock_quantity=$1,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=$2
      `,
      [newStock, product_id],
    );

    await client.query(
      `
      INSERT INTO inventory_logs
      (product_id, change_type, quantity, reference_id)
      VALUES ($1,$2,$3,$4)
      `,
      [product_id, change_type, quantity_change, reference_id],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};
