import { useState } from "react";
import AddProductModal from "../../components/admin/AddProductModal.jsx";

const ManageProducts = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddProduct = (productData) => {
    console.log("Product form data:", productData);

    // Tässä vaiheessa ei vielä tallenneta tietokantaan!
    setMessage("Form submitted (demo only — not saved to database).");

    setIsModalOpen(false);
  };

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Manage Products</h1>
          <p>Manage products in the catalog.</p>
        </div>

        <button
          type="button"
          className="admin-button admin-button--primary"
          onClick={() => setIsModalOpen(true)}
        >
          Add Product
        </button>
      </header>

      {message && <p className="admin-page__status" role="status">{message}</p>}

      <section className="admin-content-card">
        <h2>All Products</h2>
        <p>Products will be displayed here.</p>
      </section>

      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddProduct}
      />
    </section>
  );
};

export default ManageProducts;