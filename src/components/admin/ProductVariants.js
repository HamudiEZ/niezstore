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
  editVariantId,
  editForm,
  editMessage,
  editDisabled,
  onStartEdit,
  onCancelEdit,
  onEditChange,
  onSubmitEdit,
  busyAction,
}) {
  const formatMoney = (value) => {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric)) return "--";
    return numeric.toFixed(2);
  };

  const shortVariantId = (variantId) => String(variantId || "").slice(-6).toUpperCase();
  const optionCount = selectedProduct.options?.length ?? 0;

  const isIncompleteVariant = (variant) => {
    if (optionCount === 0) return false;
    const selectedOptionIds = new Set(
      (variant?.variantOptions ?? [])
        .map((entry) => entry?.optionValue?.optionId)
        .filter(Boolean)
    );
    return selectedOptionIds.size !== optionCount;
  };

  const getVariantLabel = (variant) => {
    const entries = variant?.variantOptions ?? [];
    if (!entries.length) return "Variante base";

    const parts = entries
      .map((entry) => {
        const optionName =
          entry?.optionValue?.option?.name ||
          selectedProduct.options?.find((option) => option.id === entry?.optionValue?.optionId)
            ?.name;
        const valueName = entry?.optionValue?.value;
        if (!optionName || !valueName) return null;
        return `${optionName}: ${valueName}`;
      })
      .filter(Boolean);

    return parts.length ? parts.join(" | ") : "Variante base";
  };

  return (
    <div className="space-y-3">
      <form className="space-y-3 admin-note p-3" onSubmit={onSubmit}>
        <h3 className="text-sm font-semibold admin-title">Nueva variante</h3>
        {selectedProduct.options?.length ? (
          <div className="grid gap-2">
            {selectedProduct.options.map((option) => (
              <div key={option.id} className="grid gap-1">
                <label className="text-xs admin-subtitle">{option.name}</label>
                <select
                  value={optionSelections[option.id] || ""}
                  onChange={(event) => onSelectOptionValue(option.id, event.target.value)}
                  className="admin-select"
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
          <p className="text-xs admin-subtitle">
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
            className="admin-input"
            placeholder="Precio"
          />
          <input
            name="compareAtPrice"
            value={form.compareAtPrice}
            onChange={onChange}
            type="number"
            min="1"
            className="admin-input"
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
            className="admin-input"
            placeholder="Stock disponible"
          />
          <input
            name="sku"
            value={form.sku}
            onChange={onChange}
            className="admin-input"
            placeholder="SKU (opcional, codigo interno)"
          />
        </div>
        <input
          name="imageUrl"
          value={form.imageUrl}
          onChange={onChange}
          className="admin-input"
          placeholder="URL de imagen de variante (opcional)"
        />
        <p className="text-[11px] admin-muted">
          SKU es un identificador interno para tu inventario (opcional).
        </p>
        <label className="flex items-center gap-2 text-xs admin-subtitle">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={onChange}
            className="admin-checkbox h-4 w-4"
          />
          Variante activa
        </label>
        <Button type="submit" disabled={disabled}>
          {disabled ? "Guardando..." : "Crear variante"}
        </Button>
        {message ? <p className="admin-message">{message}</p> : null}
      </form>

      <div>
        <h3 className="text-sm font-semibold admin-title">Variantes actuales</h3>
        {selectedProduct.variants?.length ? (
          <div className="mt-2 space-y-2">
            {selectedProduct.variants.map((variant) => {
              const incomplete = isIncompleteVariant(variant);
              return (
                <div
                  key={variant.id}
                  className="admin-list-item p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold admin-title">
                        ${formatMoney(variant.price)}
                      </p>
                      {variant.compareAtPrice != null ? (
                        <p className="text-xs admin-muted line-through">
                          ${formatMoney(variant.compareAtPrice)}
                        </p>
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          variant.isActive
                            ? "status-pill status-pill--active"
                            : "status-pill status-pill--inactive"
                        }`}
                      >
                        {variant.isActive ? "Activa" : "Inactiva"}
                      </span>
                      {incomplete ? (
                        <span className="status-pill status-pill--inactive rounded-full px-2 py-0.5 text-[11px] font-semibold">
                          Incompleta
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onStartEdit?.(variant)}
                        className={`variant-action-btn variant-action-btn--edit ${
                          editVariantId === variant.id
                            ? "variant-action-btn--edit-active"
                            : ""
                        }`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleStatus?.(variant.id, !variant.isActive)}
                        className={`variant-action-btn ${
                          variant.isActive
                            ? "variant-action-btn--deactivate"
                            : "variant-action-btn--activate"
                        }`}
                        disabled={
                          busyAction === `variant-toggle-${variant.id}` ||
                          (incomplete && !variant.isActive)
                        }
                        title={
                          incomplete && !variant.isActive
                            ? "Completa la combinacion de opciones antes de activar."
                            : undefined
                        }
                      >
                        {busyAction === `variant-toggle-${variant.id}`
                          ? "..."
                          : variant.isActive
                            ? "Desactivar"
                            : "Activar"}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs admin-subtitle">{getVariantLabel(variant)}</p>
                  <p className="mt-1 text-xs admin-muted">
                    Stock: {variant.stock} - SKU: {variant.sku || "N/A"} - ID:{" "}
                    {shortVariantId(variant.id)}
                  </p>
                  {variant.imageUrl ? (
                    <p className="mt-1 truncate text-[11px] admin-muted">
                      Imagen: {variant.imageUrl}
                    </p>
                  ) : null}

                  {editVariantId === variant.id ? (
                    <form className="admin-note mt-3 space-y-2 p-2" onSubmit={onSubmitEdit}>
                      <p className="text-[11px] admin-subtitle">
                        Editando: {getVariantLabel(variant)} - ID: {shortVariantId(variant.id)}
                      </p>
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          name="price"
                          value={editForm.price}
                          onChange={onEditChange}
                          type="number"
                          min="1"
                          className="admin-input h-9 text-xs"
                          placeholder="Precio"
                        />
                        <input
                          name="compareAtPrice"
                          value={editForm.compareAtPrice}
                          onChange={onEditChange}
                          type="number"
                          min="1"
                          className="admin-input h-9 text-xs"
                          placeholder="Precio comparativo"
                        />
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          name="stock"
                          value={editForm.stock}
                          onChange={onEditChange}
                          type="number"
                          min="0"
                          className="admin-input h-9 text-xs"
                          placeholder="Stock"
                        />
                        <input
                          name="sku"
                          value={editForm.sku}
                          onChange={onEditChange}
                          className="admin-input h-9 text-xs"
                          placeholder="SKU"
                        />
                      </div>
                      <input
                        name="imageUrl"
                        value={editForm.imageUrl}
                        onChange={onEditChange}
                        className="admin-input h-9 text-xs"
                        placeholder="URL de imagen (opcional)"
                      />
                      <label className="flex items-center gap-2 text-xs admin-subtitle">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={editForm.isActive}
                          onChange={onEditChange}
                          className="admin-checkbox h-4 w-4"
                        />
                        Variante activa
                      </label>
                      <div className="flex items-center gap-2">
                        <Button type="submit" size="sm" disabled={editDisabled}>
                          {editDisabled ? "Guardando..." : "Guardar cambios"}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={onCancelEdit}>
                          Cancelar
                        </Button>
                      </div>
                      {editMessage ? (
                        <p className="admin-message">{editMessage}</p>
                      ) : null}
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="admin-empty mt-2">
            <p className="text-sm admin-title">Sin variantes creadas.</p>
            <p className="mt-1 text-xs admin-muted">
              Crea una variante para empezar a manejar stock y precios.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
