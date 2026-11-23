import { useState, useEffect, useRef } from "react";
// Näyttää yksittäisen modalin, jossa voidaan lisätä tai muokata kategoriaa tai brändiä.
const DataModal = ({ entity, editingRow, rows, onClose, onSave }) => {
  const dialogRef = useRef(null);
  const isCategory = entity === "categories";

  const formInitialState = {
    name: editingRow?.name ?? "",
    slug: editingRow?.slug ?? "",
    parent_id: editingRow?.parent_id ?? "",
    is_active: editingRow ? Boolean(editingRow.is_active) : true,
  };
  const [form, setForm] = useState(formInitialState);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    console.log("handleChange:", { name, value, type, checked });
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const values = isCategory
      ? {
          name: form.name.trim(),
          slug: form.slug.trim(),
          parent_id: form.parent_id === "" ? null : Number(form.parent_id),
          is_active: form.is_active,
        }
      : {
          name: form.name.trim(),
        };

    setSaving(true);
    setError("");

    try {
      await onSave(values);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      className="admin-modal"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="data-modal-title"
    >
      <header className="admin-modal__header">
        <h2 id="data-modal-title">
          {editingRow ? "Edit" : "Add"} {isCategory ? "Category" : "Brand"}
        </h2>

        <button
          type="button"
          className="admin-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </header>

      <form className="admin-form" onSubmit={handleSubmit}>
        {editingRow && <p className="admin-form__id">ID: {editingRow.id}</p>}

        <div className="admin-form__group">
          <label htmlFor="data-name">Name</label>
          <input
            id="data-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            maxLength={120}
            required
            autoFocus
          />
        </div>

        {isCategory && (
          <>
            <div className="admin-form__group">
              <label htmlFor="data-slug">Slug</label>
              <input
                id="data-slug"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={140}
                required
              />
            </div>

            <div className="admin-form__group">
              <label htmlFor="data-parent">Parent Category</label>

              <select
                id="data-parent"
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
              >
                <option value="">None</option>

                {rows
                  .filter((row) => row.id !== editingRow?.id)
                  .map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name} (ID: {row.id})
                    </option>
                  ))}
              </select>
            </div>

            <div className="admin-form__group admin-form__checkbox">
              <label htmlFor="data-active">
                <input
                  id="data-active"
                  name="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                Active
              </label>
            </div>
          </>
        )}

        {error && <p role="alert">{error}</p>}

        <footer className="admin-modal__footer">
          <button
            type="button"
            className="admin-button admin-button--secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="admin-button admin-button--primary"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </footer>
      </form>
    </dialog>
  );
};

export default DataModal;
