import { NavLink, Outlet } from "react-router";

const sections = [
  { path: "brands", name: "Brands" },
  { path: "categories", name: "Categories" },
  { path: "attributes", name: "Attributes" },
  { path: "attribute-values", name: "Attribute Values" },
  { path: "locations", name: "Locations" },
];

const ManageData = () => {
  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1>Manage Data</h1>
          <p>Manage store catalog data and settings.</p>
        </div>
      </header>

      <nav className="admin-data-tabs" aria-label="Data management">
        {sections.map((section) => (
          <NavLink className="admin-data-tabs__link" key={section.path} to={section.path} end>
            {section.name}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </section>
  );
};

export default ManageData;