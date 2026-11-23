import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import Home from "./views/Home.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import ManageProducts from "./views/admin/ManageProducts.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Julkinen verkkokauppa */}
        <Route path="/" element={<Home />} />

        {/* Admin-hallinta */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            index
            element={<Navigate to="products" replace />}
          />

          <Route
            path="products"
            element={<ManageProducts />}
          />
        </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default App;