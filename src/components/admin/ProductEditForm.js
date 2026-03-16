import { Button } from "../ui/button";
import ProductImages from "./ProductImages";

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
    <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Editar producto</h3>
          <p className="mt-1 text-xs text-slate-400">
            Actualiza nombre, descripcion, marca, categoria o slug.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={disabled}
        >
          Restablecer
        </Button>
      </div>

      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
          placeholder="Nombre del producto"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          placeholder="Descripcion"
        />
        <div className="grid gap-2 md:grid-cols-2">
          <input
            name="brand"
            value={form.brand}
            onChange={onChange}
            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
            placeholder="Marca (opcional)"
          />
          <input
            name="slug"
            value={form.slug}
            onChange={onChange}
            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
            placeholder="Slug (opcional)"
          />
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={onChange}
            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
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
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={onChange}
              className="h-4 w-4"
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
        {message ? <p className="text-xs text-cyan-300">{message}</p> : null}
      </form>
    </article>
  );
}
