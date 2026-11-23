import { Router } from "express";
import { body, param } from "express-validator";

import { validateRequest } from "../middlewares/validation.js";

import {
  getBrands,
  postBrand,
  patchBrand,
  getCategories,
  postCategory,
  patchCategory,
} from "../controllers/adminDataController.js";

const router = Router();

// ===VALIDATION===

const brandFields = [
  body("name")
    .isString()
    .withMessage("Name must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ max: 120 })
    .withMessage("Name must be at most 120 characters"),
];

const categoryFields = [
  body("name")
    .isString()
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ max: 120 })
    .withMessage("Name is too long"),

  body("slug")
    .isString()
    .bail()
    .trim()
    .matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .withMessage("Invalid slug")
    .bail()
    .isLength({ max: 140 }),

  body("parent_id")
    .optional({ values: "null" })
    .isInt({ min: 1 })
    .withMessage("Invalid parent ID")
    .toInt(),

  body("is_active")
    .isBoolean()
    .withMessage("Invalid active status")
    .toBoolean(),
];

const idField = [param("id").isInt({ min: 1 }).withMessage("Invalid ID")];

// === BRANDS ROUTES ===

router
  .route("/brands")
  .get(getBrands)
  .post(brandFields, validateRequest, postBrand);

router
  .route("/brands/:id")
  .patch(idField, brandFields, validateRequest, patchBrand);

// === CATEGORIES ROUTES ===

router
  .route("/categories")
  .get(getCategories)
  .post(categoryFields, validateRequest, postCategory);

router
  .route("/categories/:id")
  .patch(idField, categoryFields, validateRequest, patchCategory);

export default router;
