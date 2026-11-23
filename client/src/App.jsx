import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import Home from "./views/Home.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import ManageProducts from "./views/admin/ManageProducts.jsx";
import ManageData from "./views/admin/ManageData.jsx";
import DataList from "./views/admin/DataList.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Julkinen verkkokauppa */}
        <Route path="/" element={<Home />} />

        {/* Admin-hallinta */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="products" replace />} />

          <Route path="products" element={<ManageProducts />} />

          <Route path="data" element={<ManageData />}>
            <Route index element={<Navigate to="brands" replace />} />

            <Route path="brands" element={<DataList entity="brands" />} />

            <Route
              path="categories"
              element={<DataList entity="categories" />}
            />

            <Route
              path="attributes"
              element={<p>Attributes – Coming soon</p>}
            />

            <Route
              path="attribute-values"
              element={<p>Attribute Values – Coming soon</p>}
            />

            <Route path="locations" element={<p>Locations – Coming soon</p>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
