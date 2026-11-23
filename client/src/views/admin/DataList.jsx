import { useState, useEffect } from "react";

import DataModal from "../../components/admin/DataModal.jsx";

import {
  getAdminData,
  createAdminData,
  updateAdminData,
} from "../../services/adminDataApi.js";

const DataList = ({ entity }) => {
  const [rows, setRows] = useState([]); // Tietokannasta haetut rivit
  const [loading, setLoading] = useState(true); //Näytetäänkö latausilmoitus
  const [error, setError] = useState(""); // API virheen teksti

  const [search, setSearch] = useState(""); // Hakukentän teksti
  const [page, setPage] = useState(1); // Sivunumero, jota näytetään

  const [isModalOpen, setIsModalOpen] = useState(false); // Näytetäänkö muokkausmodal
  const [editingRow, setEditingRow] = useState(null); // Muokattava rivi, null = lisätään uusi

  const isCategory = entity === "categories"; // Köytetäänkö kategorioiden vai brändien näkymää (Myöhemmin viittaus muokattavaan entityyn, kuten. attribute, location jne.)
  const title = isCategory ? "Categories" : "Brands"; // Näytettävä otsikko (Tämä muokataan myös myöhemmin dynaamiseksi.)

  // Haetaan tiedot aina, kun entity vaihtuu
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");
    setRows([]);
    setPage(1);

    getAdminData(entity)
      .then((data) => {
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [entity]);

  const handleAdd = () => {
    setEditingRow(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditingRow(row);
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    if (editingRow) {
      await updateAdminData(entity, editingRow.id, values);
    } else {
      await createAdminData(entity, values);
    }

    const updatedRows = await getAdminData(entity);
    setRows(updatedRows);
    setIsModalOpen(false);
  };

  // Suodatetaan hakutulokset ennen sivutusta
  const filteredRows = rows.filter((row) =>
    row.name.toLowerCase().includes(search.toLowerCase()),
  );

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const visibleRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return (
    <section className="admin-data-list admin-content-card">
      <header className="admin-list-header">
        <h2>{title}</h2>

        <button
          type="button"
          className="admin-button admin-button--primary"
          onClick={handleAdd}
        >
          + Add {isCategory ? "Category" : "Brand"}
        </button>
      </header>

      <div className="admin-search">
        <input
          className="admin-search__input"
          type="search"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading && <p>Loading...</p>}
      {error && <p role="alert">{error}</p>}

      {!loading && !error && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  {isCategory && <th>Slug</th>}
                  {isCategory && <th>Parent ID</th>}
                  {isCategory && <th>Active</th>}
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.name}</td>

                    {isCategory && <td>{row.slug}</td>}

                    {isCategory && <td>{row.parent_id ?? "-"}</td>}

                    {isCategory && <td>{row.is_active ? "Yes" : "No"}</td>}

                    <td>
                      <button
                        type="button"
                        className="admin-table__action"
                        onClick={() => handleEdit(row)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRows.length === 0 && (
            <p className="admin-empty">No {title.toLowerCase()} found.</p>
          )}

          <nav className="admin-pagination" aria-label={`${title} pagination`}>
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            
            {/* Luo aluksi listan kaikista sivunumeroista ja mapataan ne button elementeiksi*/}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  aria-current={page === pageNum ? "page" : undefined}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              ),
            )}

            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </nav>
        </>
      )}

      {isModalOpen && (
        <DataModal
          entity={entity}
          editingRow={editingRow}
          rows={rows}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </section>
  );
};

export default DataList;
