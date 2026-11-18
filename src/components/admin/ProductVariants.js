import Image from "next/image";
import { Button } from "../ui/button";
import { INPUT_LIMITS } from "@/lib/input-limits";
import CharCount from "./CharCount";

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
  onDeleteVariant,
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

  const renderImagePicker = (currentUrl, isEditing = false) => {
    const images = selectedProduct.images || [];

    if (images.length === 0 && !currentUrl) {
      return (
        <p className="admin-muted text-[10px]">
          No hay imágenes subidas. Sube fotos primero para asignarlas.
        </p>
      );
    }

    return (
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider admin-subtitle">
          Imagen de variante
        </label>
        <div className="flex flex-wrap gap-2">
          {/* None Option */}
          <button
            type="button"
            onClick={() => {
              const e = { target: { name: "imageUrl", value: "" } };
              isEditing ? onEditChange(e) : onChange(e);
            }}
            className={`relative flex h-16 w-16 items-center justify-center rounded-lg border-2 text-[10px] transition ${
              !currentUrl
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            Ninguna
          </button>

          {/* Product Images */}
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => {
                const e = { target: { name: "imageUrl", value: img.url } };
                isEditing ? onEditChange(e) : onChange(e);
              }}
              className={`group relative h-16 w-16 overflow-hidden rounded-lg border-2 transition ${
                currentUrl === img.url
                  ? "border-cyan-500 shadow-md shadow-cyan-500/20"
                  : "border-transparent hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <Image
                src={img.url}
                alt="Seleccionable"
                fill
                className="object-cover"
                sizes="64px"
              />
              {currentUrl === img.url && (
                <div className="absolute inset-0 flex items-center justify-center bg-cyan-500/10">
                  <div className="h-2 w-2 rounded-full bg-cyan-500" />
                </div>
              )}
            </button>
          ))}
        </div>
        {images.length === 0 && currentUrl ? (
          <p className="admin-muted text-[10px]">
            No hay imágenes cargadas en el producto; haz clic en &ldquo;Ninguna&rdquo; para desvincular la imagen anterior.
          </p>
        ) : null}
      </div>
    );
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
            step="0.01"
            min="0.01"
            max={INPUT_LIMITS.priceMax}
            className="admin-input"
            placeholder="Precio"
          />
          <input
            name="compareAtPrice"
            value={form.compareAtPrice}
            onChange={onChange}
            type="number"
            step="0.01"
            min="0.01"
            max={INPUT_LIMITS.priceMax}
            className="admin-input"
            placeholder="Precio anterior (mayor al actual)"
          />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            name="stock"
            value={form.stock}
            onChange={onChange}
            type="number"
            step="1"
            min="0"
            max={INPUT_LIMITS.stockMax}
            className="admin-input"
            placeholder="Stock disponible"
          />
          <div className="admin-input-wrap">
            <input
              name="sku"
              value={form.sku}
              onChange={onChange}
              maxLength={INPUT_LIMITS.sku}
              className="admin-input"
              placeholder="SKU (opcional, codigo interno)"
            />
            <CharCount value={form.sku} max={INPUT_LIMITS.sku} />
          </div>
        </div>
        {renderImagePicker(form.imageUrl)}
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
              const isDeleting = busyAction === `variant-delete-${variant.id}`;
              const isToggling = busyAction === `variant-toggle-${variant.id}`;
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
                        disabled={isDeleting}
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
                          isToggling ||
                          isDeleting ||
                          (incomplete && !variant.isActive)
                        }
                        title={
                          incomplete && !variant.isActive
                            ? "Completa la combinacion de opciones antes de activar."
                            : undefined
                        }
                      >
                        {isToggling
                          ? "..."
                          : variant.isActive
                            ? "Desactivar"
                            : "Activar"}
                      </button>
                      {onDeleteVariant ? (
                        <button
                          type="button"
                          onClick={() => onDeleteVariant(variant.id)}
                          disabled={isDeleting || isToggling}
                          className="variant-action-btn variant-action-btn--deactivate"
                        >
                          {isDeleting ? "..." : "Eliminar"}
                        </button>
                      ) : null}
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
                          step="0.01"
                          min="0.01"
                          max={INPUT_LIMITS.priceMax}
                          className="admin-input h-9 text-xs"
                          placeholder="Precio"
                        />
                        <input
                          name="compareAtPrice"
                          value={editForm.compareAtPrice}
                          onChange={onEditChange}
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={INPUT_LIMITS.priceMax}
                          className="admin-input h-9 text-xs"
                          placeholder="Precio anterior (mayor al actual)"
                        />
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <input
                          name="stock"
                          value={editForm.stock}
                          onChange={onEditChange}
                          type="number"
                          step="1"
                          min="0"
                          max={INPUT_LIMITS.stockMax}
                          className="admin-input h-9 text-xs"
                          placeholder="Stock"
                        />
                        <div className="admin-input-wrap">
                          <input
                            name="sku"
                            value={editForm.sku}
                            onChange={onEditChange}
                            maxLength={INPUT_LIMITS.sku}
                            className="admin-input h-9 text-xs"
                            placeholder="SKU"
                          />
                          <CharCount value={editForm.sku} max={INPUT_LIMITS.sku} />
                        </div>
                      </div>
                      {renderImagePicker(editForm.imageUrl, true)}
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
