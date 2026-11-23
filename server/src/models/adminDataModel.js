import pool from "../config/database.js";

// ===== BRANDS =====

// Haetaan kaikki tuotemerkit
export const getAllBrands = async () => {
  const [rows] = await pool.execute("SELECT id, name FROM brands ORDER BY id");

  return rows;
};

// Haetaan tuotemerkki ID:n perusteella
export const getBrandById = async (id) => {
  const [rows] = await pool.execute(
    "SELECT id, name FROM brands WHERE id = ?",
    [id],
  );

  return rows[0] ?? null;
};

// Lisätään tuotemerkki
export const createBrand = async (name) => {
  const [result] = await pool.execute("INSERT INTO brands (name) VALUES (?)", [
    name,
  ]);

  return result.insertId;
};

// Päivitetään tuotemerkki
export const updateBrand = async (id, name) => {
  const [result] = await pool.execute(
    "UPDATE brands SET name = ? WHERE id = ?",
    [name, id],
  );

  return result.affectedRows;
};

// ===== CATEGORIES =====

// Haetaan kaikki kategoriat
export const getAllCategories = async () => {
  const [rows] = await pool.execute(
    `SELECT id, name, slug, parent_id, is_active
     FROM categories
     ORDER BY id`,
  );

  return rows;
};

// Haetaan kategoria ID:n perusteella
export const getCategoryById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, name, slug, parent_id, is_active
     FROM categories
     WHERE id = ?`,
    [id],
  );

  return rows[0] ?? null;
};

// Lisätään kategoria
export const createCategory = async (category) => {
  const { name, slug, parent_id, is_active } = category;

  const [result] = await pool.execute(
    `INSERT INTO categories
      (name, slug, parent_id, is_active)
     VALUES (?, ?, ?, ?)`,
    [name, slug, parent_id ?? null, Number(is_active)],
  );

  return result.insertId;
};

// Päivitetään kategoria
export const updateCategory = async (id, category) => {
  const { name, slug, parent_id, is_active } = category;

  const [result] = await pool.execute(
    `UPDATE categories
     SET name = ?, slug = ?, parent_id = ?, is_active = ?
     WHERE id = ?`,
    [name, slug, parent_id ?? null, Number(is_active), id],
  );

  return result.affectedRows;
};
