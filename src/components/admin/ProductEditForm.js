import { Button } from "../ui/button";
import ProductImages from "./ProductImages";
import { INPUT_LIMITS } from "@/lib/input-limits";
import CharCount from "./CharCount";

export default function ProductEditForm({
  form,
  categories,
  message,
  disabled,
  images,
  imageMessage,
  imageDisabled,
  onUploadImages,
  onRemoveImage,
  onChange,
  onSubmit,
  onReset,
}) {
  const categoryReady = Boolean(form.categoryId);

  return (
    <article className="admin-list-item p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold admin-title">Editar producto</h3>
          <p className="mt-1 text-xs admin-subtitle">
            Actualiza nombre, descripcion, marca, categoria o slug.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onReset} disabled={disabled}>
          Restablecer
        </Button>
      </div>

      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="admin-input-wrap">
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            maxLength={INPUT_LIMITS.productName}
            className="admin-input"
            placeholder="Nombre del producto"
          />
          <CharCount value={form.name} max={INPUT_LIMITS.productName} />
        </div>
        <div className="admin-input-wrap">
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows={3}
            maxLength={INPUT_LIMITS.productDescription}
            className="admin-textarea"
            placeholder="Descripcion"
          />
          <CharCount value={form.description} max={INPUT_LIMITS.productDescription} />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="admin-input-wrap">
            <input
              name="brand"
              value={form.brand}
              onChange={onChange}
              maxLength={INPUT_LIMITS.productBrand}
              className="admin-input"
              placeholder="Marca (opcional)"
            />
            <CharCount value={form.brand} max={INPUT_LIMITS.productBrand} />
          </div>
          <div className="admin-input-wrap">
            <input
              name="slug"
              value={form.slug}
              onChange={onChange}
              maxLength={INPUT_LIMITS.slug}
              className="admin-input"
              placeholder="Slug (opcional)"
            />
            <CharCount value={form.slug} max={INPUT_LIMITS.slug} />
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={onChange}
            className="admin-select"
          >
            {categories.length === 0 ? (
              <option value="">Crea una categoria primero</option>
            ) : (
              categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )}
          </select>
          <label className="flex items-center gap-2 text-xs admin-subtitle">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={onChange}
              className="admin-checkbox h-4 w-4"
            />
            Producto activo
          </label>
        </div>

        <div className="mt-5">
          <ProductImages
            images={images}
            onUpload={onUploadImages}
            onRemove={onRemoveImage}
            disabled={imageDisabled}
            message={imageMessage}
          />
        </div>

        <Button type="submit" className="w-full" disabled={disabled || !categoryReady}>
          {disabled ? "Guardando..." : "Guardar cambios"}
        </Button>
        {message ? <p className="admin-message">{message}</p> : null}
      </form>
    </article>
  );
}
