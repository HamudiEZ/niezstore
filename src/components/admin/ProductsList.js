export default function ProductsList({
  loading,
  products,
  totalCount,
  categories,
  selectedProductId,
  searchTerm,
  categoryFilter,
  statusFilter,
  onSearchTermChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onSelect,
  onToggleStatus,
  busyAction,
}) {
  return (
    <article className="soft-card p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-slate-100">Productos</h2>
        <span className="text-xs text-slate-400">
          {loading ? "Cargando..." : `${totalCount} items`}
        </span>
      </div>

      <div className="mb-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_160px_140px]">
        <input
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
          placeholder="Buscar por nombre, marca o categoria"
        />
        <select
          value={categoryFilter}
          onChange={(event) => onCategoryFilterChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
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
          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      <div className="space-y-2">
        {products.length === 0 ? (
          <p className="text-sm text-slate-400">
            No hay productos cargados todavia.
          </p>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className={`grid gap-2 rounded-lg border p-3 md:grid-cols-[1.4fr_0.7fr_0.7fr_0.9fr] md:items-center ${
                selectedProductId === product.id
                  ? "border-cyan-500/70 bg-cyan-500/10"
                  : "border-slate-700 bg-slate-900/70"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-slate-100">{product.name}</p>
                <p className="text-xs text-slate-500">
                  {product.brand || "Sin marca"} • {product.category?.name}
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Variantes: {product.variants?.length ?? 0}
              </p>
                <span
                  className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    product.isActive
                      ? "status-pill status-pill--active"
                      : "status-pill status-pill--inactive"
                  }`}
                >
                  {product.isActive ? "Activo" : "Inactivo"}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                  type="button"
                  onClick={() => onSelect(product.id)}
                  className="rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                >
                  Gestionar
                </button>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(product.id, !product.isActive)}
                    className={`rounded-md border px-2 py-1 text-xs transition ${
                      product.isActive
                        ? "border-rose-500/50 text-rose-300 hover:bg-rose-500/10"
                        : "border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10"
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
    </article>
  );
}
