import { useState, useEffect, useRef } from "react";

const initialForm = {
  name: "",
  description: "",
  brandId: "",
  categoryId: "",
  sku: "",
  price: "",
  isActive: true,
};

const AddProductModal = ({ isOpen, onClose, onSubmit }) => {
  const dialogRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [image, setImage] = useState(null);

  // Avataan tai suljetaan HTML-dialog tilan perusteella
  useEffect(() => {
    const dialog = dialogRef.current;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Käsitellään kaikkien tekstikenttien ja checkboxin muutokset
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    //console.log('handleChange:', { name, value, type, checked });
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (event) => {
    const selectedImage = event.target.files?.[0] ?? null;
    setImage(selectedImage);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      ...form,
      image,
    });

    // Tyhjennetään lomake
    setForm(initialForm);
    setImage(null);
    event.currentTarget.reset();
  };

  return (
    <dialog className="admin-modal" ref={dialogRef} onClose={onClose} aria-labelledby="add-product-title">
      <header className="admin-modal__header">
        <h2 id="add-product-title">Add Product</h2>

        <button type="button" className="admin-modal__close" onClick={onClose} aria-label="Close dialog">
          ×
        </button>
      </header>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form__group">
          <label htmlFor="product-name">Product Name</label>
          <input
            id="product-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="admin-form__group">
          <label htmlFor="product-description">Description</label>
          <textarea
            id="product-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
          />
        </div>

        <div className="admin-form__group">
          <label htmlFor="product-brand">Brand</label>
          <select
            id="product-brand"
            name="brandId"
            value={form.brandId}
            onChange={handleChange}
          >
            <option value="">Select brand</option>
            <option value="1">Nike</option>
            <option value="2">Adidas</option>
          </select>
        </div>

        <div className="admin-form__group">
          <label htmlFor="product-category">Category</label>
          <select
            id="product-category"
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>
            <option value="1">Clothing</option>
            <option value="2">Equipment</option>
            <option value="3">Supplements</option>
          </select>
        </div>

        <div className="admin-form__group">
          <label htmlFor="product-sku">SKU</label>
          <input
            id="product-sku"
            name="sku"
            type="text"
            value={form.sku}
            onChange={handleChange}
            required
          />
        </div>

        <div className="admin-form__group">
          <label htmlFor="product-price">Price (€)</label>
          <input
            id="product-price"
            name="price"
            type="number"
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="admin-form__group">
          <label htmlFor="product-image">Product Image</label>
          <input
            id="product-image"
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageChange}
          />

          {image && <p>Selected: {image.name}</p>}
        </div>

        <div className="admin-form__group admin-form__checkbox">
          <label htmlFor="product-active">
            <input
              id="product-active"
              name="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={handleChange}
            />
            Active Product
          </label>
        </div>

        <footer className="admin-modal__footer">
          <button type="button" className="admin-button admin-button--secondary" onClick={onClose}>
            Cancel
          </button>

          <button type="submit" className="admin-button admin-button--primary">
            Save Product
          </button>
        </footer>
      </form>
    </dialog>
  );
};

export default AddProductModal;