import {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
} from "../models/adminDataModel.js";

// ===== BRANDS =====

// GET /api/admin/data/brands
export const getBrands = async (req, res, next) => {
  try {
    const brands = await getAllBrands();

    res.json(brands);
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/data/brands
export const postBrand = async (req, res, next) => {
  try {
    const { name } = req.body;

    const newBrandId = await createBrand(name);
    const newBrand = await getBrandById(newBrandId);

    res.status(201).json(newBrand);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Brand name already exists",
      });
    }

    next(error);
  }
};

// PATCH /api/admin/data/brands/:id
export const patchBrand = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;

    const existingBrand = await getBrandById(id);

    if (!existingBrand) {
      return res.status(404).json({
        error: "Brand not found",
      });
    }

    await updateBrand(id, name);

    const updatedBrand = await getBrandById(id);
    res.json(updatedBrand);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Brand name already exists",
      });
    }

    next(error);
  }
};

// ===== CATEGORIES =====

// GET /api/admin/data/categories
export const getCategories = async (req, res, next) => {
  try {
    const categories = await getAllCategories();

    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/data/categories
export const postCategory = async (req, res, next) => {
  try {
    const category = req.body;

    const newCategoryId = await createCategory(category);
    const newCategory = await getCategoryById(newCategoryId);

    res.status(201).json(newCategory);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Category name or slug already exists",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Parent category does not exist",
      });
    }

    next(error);
  }
};

// PATCH /api/admin/data/categories/:id
export const patchCategory = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const category = req.body;

    const existingCategory = await getCategoryById(id);

    if (!existingCategory) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    if (category.parent_id === id) {
      return res.status(400).json({
        error: "Category cannot be its own parent",
      });
    }

    await updateCategory(id, category);

    const updatedCategory = await getCategoryById(id);
    res.json(updatedCategory);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Category name or slug already exists",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        error: "Parent category does not exist",
      });
    }

    next(error);
  }
};
