import { NavLink, Link } from "react-router";

const AdminSidebar = () => {
  return (
    <aside>
      <h2>Sport Admin</h2>

      <nav>
        <ul>
          <li>
            <NavLink to="/admin/products">
              Manage Products
            </NavLink>
          </li>

          <li>
            <NavLink to="/admin/variants">
              Manage Variants
            </NavLink>
          </li>

          <li>
            <NavLink to="/admin/shipments">
              Manage Shipments
            </NavLink>
          </li>

          <li>
            <NavLink to="/admin/analytics">
              Analytics
            </NavLink>
          </li>
        </ul>
      </nav>

      <Link to="/">Back to Store</Link>
    </aside>
  );
};

export default AdminSidebar;