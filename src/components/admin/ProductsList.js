import Pagination from "../ui/pagination";

export default function ProductsList({
  loading,
  products,
  totalCount,
  filteredCount,
  categories,
  selectedProductId,
  searchTerm,
  categoryFilter,
  statusFilter,
  page,
  totalPages,
  pageSize,
  onSearchTermChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onPageChange,
  onSelect,
  onToggleStatus,
  busyAction,
}) {
  const hasProducts = products.length > 0;

  return (
    <article className="soft-card p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold admin-title">Productos</h2>
          <p className="mt-1 text-xs admin-subtitle">
            Lista filtrada para seleccionar y gestionar variantes.
          </p>
        </div>
        <span className="admin-chip-count">
          {loading ? "Cargando..." : `${filteredCount} de ${totalCount}`}
        </span>
      </div>

      <div className="mb-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_160px_140px]">
        <input
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="admin-input"
          placeholder="Buscar por nombre, marca o categoria"
        />
        <select
          value={categoryFilter}
          onChange={(event) => onCategoryFilterChange(event.target.value)}
          className="admin-select"
        >
          <option value="all">Todas las categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          className="admin-select"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      <div className="space-y-2">
        {!hasProducts ? (
          <div className="admin-empty">
            <p className="text-sm admin-title">No hay productos en esta vista.</p>
            <p className="mt-1 text-xs admin-muted">
              Ajusta filtros o crea un producto nuevo para comenzar.
            </p>
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className={`grid gap-3 rounded-xl border p-3 md:grid-cols-[1.4fr_0.65fr_0.65fr_0.95fr] md:items-center ${
                selectedProductId === product.id
                  ? "admin-list-item admin-list-item--selected"
                  : "admin-list-item"
              }`}
            >
              <div>
                <p className="text-sm font-semibold admin-title">{product.name}</p>
                <p className="text-xs admin-subtitle">
                  {product.brand || "Sin marca"} - {product.category?.name || "Sin categoria"}
                </p>
                <p className="truncate text-[11px] admin-muted">/{product.slug}</p>
              </div>
              <p className="text-xs admin-subtitle">Variantes: {product.variants?.length ?? 0}</p>
              <span
                className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  product.isActive
                    ? "status-pill status-pill--active"
                    : "status-pill status-pill--inactive"
                }`}
              >
                {product.isActive ? "Activo" : "Inactivo"}
              </span>
              <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                <button
                  type="button"
                  onClick={() => onSelect(product.id)}
                  className="variant-action-btn variant-action-btn--edit"
                >
                  Gestionar
                </button>
                <button
                  type="button"
                  onClick={() => onToggleStatus(product.id, !product.isActive)}
                  className={`variant-action-btn ${
                    product.isActive
                      ? "variant-action-btn--deactivate"
                      : "variant-action-btn--activate"
                  }`}
                  disabled={busyAction === `toggle-${product.id}`}
                >
                  {busyAction === `toggle-${product.id}`
                    ? "..."
                    : product.isActive
                      ? "Desactivar"
                      : "Activar"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={filteredCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
        className="mt-4"
      />
    </article>
  );
}
