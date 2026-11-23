import { NavLink, Link } from "react-router";

const AdminSidebar = () => {
  return (
    <aside className="admin-sidebar">
      <h2 className="admin-sidebar__title">Sport Admin</h2>

      <nav className="admin-sidebar__nav">
        <ul className="admin-sidebar__list">
          <li>
            <NavLink className="admin-sidebar__link" to="/admin/products">Manage Products</NavLink>
          </li>

          <li>
            <NavLink className="admin-sidebar__link" to="/admin/variants">Manage Variants</NavLink>
          </li>

          <li>
            <NavLink className="admin-sidebar__link" to="/admin/shipments">Manage Shipments</NavLink>
          </li>

          <li>
            <NavLink className="admin-sidebar__link" to="/admin/analytics">Analytics</NavLink>
          </li>

          <li>
            <NavLink className="admin-sidebar__link" to="/admin/data">Manage Data</NavLink>
          </li>
        </ul>
      </nav>

      <Link className="admin-sidebar__back" to="/">Back to Store</Link>
    </aside>
  );
};

export default AdminSidebar;
