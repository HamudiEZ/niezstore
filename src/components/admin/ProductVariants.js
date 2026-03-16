import { Button } from "../ui/button";

export default function ProductVariants({
  selectedProduct,
  form,
  optionSelections,
  message,
  disabled,
  onChange,
  onSelectOptionValue,
  onSubmit,
  onToggleStatus,
  busyAction,
}) {
  const formatMoney = (value) => {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric)) return "--";
    return numeric.toFixed(2);
  };

  return (
    <div className="space-y-3">
      <form className="space-y-3" onSubmit={onSubmit}>
        <h3 className="text-sm font-semibold text-slate-100">Nueva variante</h3>
        {selectedProduct.options?.length ? (
          <div className="grid gap-2">
            {selectedProduct.options.map((option) => (
              <div key={option.id} className="grid gap-1">
                <label className="text-xs text-slate-400">{option.name}</label>
                <select
                  value={optionSelections[option.id] || ""}
                  onChange={(event) => onSelectOptionValue(option.id, event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
                >
                  <option value="">Selecciona un valor</option>
                  {option.values.map((value) => (
                    <option key={value.id} value={value.id}>
                      {value.value}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Este producto no tiene opciones. Se creara una variante por defecto.
          </p>
        )}
        <div className="grid gap-2 md:grid-cols-2">
          <input
            name="price"
            value={form.price}
            onChange={onChange}
            type="number"
            min="1"
            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
            placeholder="Precio"
          />
          <input
            name="compareAtPrice"
            value={form.compareAtPrice}
            onChange={onChange}
            type="number"
            min="1"
            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
            placeholder="Precio antes de descuento (opcional)"
          />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            name="stock"
            value={form.stock}
            onChange={onChange}
            type="number"
            min="0"
            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
            placeholder="Stock disponible"
          />
          <input
            name="sku"
            value={form.sku}
            onChange={onChange}
            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
            placeholder="SKU (opcional, codigo interno)"
          />
        </div>
        <p className="text-[11px] text-slate-500">
          SKU es un identificador interno para tu inventario (opcional).
        </p>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={onChange}
            className="h-4 w-4"
          />
          Variante activa
        </label>
        <Button type="submit" disabled={disabled}>
          {disabled ? "Guardando..." : "Crear variante"}
        </Button>
        {message ? <p className="text-xs text-cyan-300">{message}</p> : null}
      </form>

      <div>
        <h3 className="text-sm font-semibold text-slate-100">Variantes actuales</h3>
        {selectedProduct.variants?.length ? (
          <div className="mt-2 space-y-2">
            {selectedProduct.variants.map((variant) => (
              <div
                key={variant.id}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-100">
                      ${formatMoney(variant.price)}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        variant.isActive
                          ? "status-pill status-pill--active"
                          : "status-pill status-pill--inactive"
                      }`}
                    >
                      {variant.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleStatus?.(variant.id, !variant.isActive)}
                    className={`rounded-md border px-2 py-1 text-xs transition ${
                      variant.isActive
                        ? "border-rose-500/50 text-rose-300 hover:bg-rose-500/10"
                        : "border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10"
                    }`}
                    disabled={busyAction === `variant-toggle-${variant.id}`}
                  >
                    {busyAction === `variant-toggle-${variant.id}`
                      ? "..."
                      : variant.isActive
                        ? "Desactivar"
                        : "Activar"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Stock: {variant.stock} - SKU: {variant.sku || "N/A"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-400">Sin variantes creadas.</p>
        )}
      </div>
    </div>
  );
}
