import { Button } from "../ui/button";
import Pagination from "../ui/pagination";

export default function CategoryForm({
  form,
  message,
  messageTone = "info",
  disabled,
  onChange,
  onSubmit,
  categories = [],
  totalCount = 0,
  filteredCount = 0,
  page = 1,
  totalPages = 1,
  pageSize = 5,
  searchTerm = "",
  onSearchTermChange,
  onPageChange,
  editingCategoryId,
  editForm,
  onStartEdit,
  onEditChange,
  onCancelEdit,
  onSubmitEdit,
  onDeleteCategory,
  busyAction,
}) {
  const safeTotalCount = Number.isFinite(totalCount) ? totalCount : categories.length;
  const safeFilteredCount = Number.isFinite(filteredCount)
    ? filteredCount
    : categories.length;

  const visibleCountLabel =
    safeFilteredCount === safeTotalCount
      ? `${safeTotalCount} total`
      : `${safeFilteredCount} de ${safeTotalCount}`;

  return (
    <article className="soft-card p-4 md:p-5">
      <h2 className="text-base font-bold admin-title">Crear categoria</h2>
      <p className="mt-1 text-xs admin-subtitle">
        Define la estructura del catalogo antes de cargar productos.
      </p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          className="admin-input"
          placeholder="Nombre de la categoria"
        />
        <input
          name="slug"
          value={form.slug}
          onChange={onChange}
          className="admin-input"
          placeholder="Slug (opcional)"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          rows={3}
          className="admin-textarea"
          placeholder="Descripcion (opcional)"
        />
        <Button type="submit" className="w-full" disabled={disabled}>
          {disabled ? "Creando..." : "Crear categoria"}
        </Button>
        {message ? (
          <p
            className={`admin-message ${
              messageTone === "error"
                ? "admin-message--error"
                : messageTone === "success"
                  ? "admin-message--success"
                  : ""
            }`}
          >
            {message}
          </p>
        ) : null}
      </form>

      <div className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold admin-title">Categorias actuales</h3>
          <span className="admin-chip-count">{visibleCountLabel}</span>
        </div>

        <input
          value={searchTerm}
          onChange={(event) => onSearchTermChange?.(event.target.value)}
          className="admin-input mt-2"
          placeholder="Buscar categoria por nombre, slug o descripcion"
        />

        {categories.length ? (
          <>
            <div className="mt-2 space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="admin-list-item p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold admin-title">{category.name}</p>
                      <p className="text-xs admin-muted">/{category.slug}</p>
                      {category.description ? (
                        <p className="mt-1 text-xs admin-subtitle">{category.description}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onStartEdit?.(category)}
                        className="variant-action-btn variant-action-btn--edit"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory?.(category.id)}
                        disabled={busyAction === `category-delete-${category.id}`}
                        className="variant-action-btn variant-action-btn--deactivate"
                      >
                        {busyAction === `category-delete-${category.id}` ? "..." : "Eliminar"}
                      </button>
                    </div>
                  </div>

                  {editingCategoryId === category.id ? (
                    <form className="mt-3 space-y-2" onSubmit={onSubmitEdit}>
                      <input
                        name="name"
                        value={editForm?.name ?? ""}
                        onChange={onEditChange}
                        className="admin-input h-9 text-xs"
                        placeholder="Nombre"
                      />
                      <input
                        name="slug"
                        value={editForm?.slug ?? ""}
                        onChange={onEditChange}
                        className="admin-input h-9 text-xs"
                        placeholder="Slug"
                      />
                      <textarea
                        name="description"
                        value={editForm?.description ?? ""}
                        onChange={onEditChange}
                        rows={2}
                        className="admin-textarea text-xs"
                        placeholder="Descripcion"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={busyAction === `category-edit-${category.id}`}
                        >
                          {busyAction === `category-edit-${category.id}` ? "Guardando..." : "Guardar"}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={safeFilteredCount}
              pageSize={pageSize}
              onPageChange={onPageChange}
              className="mt-3"
            />
          </>
        ) : (
          <div className="admin-empty mt-2">
            <p className="text-sm admin-title">
              {safeTotalCount
                ? "No hay coincidencias para esa busqueda."
                : "Sin categorias creadas."}
            </p>
            <p className="mt-1 text-xs admin-muted">
              {safeTotalCount
                ? "Prueba con otro termino o limpia el buscador."
                : "Crea al menos una categoria para habilitar productos."}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
