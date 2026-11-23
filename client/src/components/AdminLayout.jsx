import { Outlet } from "react-router";
import AdminSidebar from "./admin/AdminSidebar.jsx";

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;