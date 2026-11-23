import { Outlet } from "react-router";
import AdminSidebar from "./admin/AdminSidebar.jsx";

const AdminLayout = () => {
  return (
    <div>
      <AdminSidebar />

      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;