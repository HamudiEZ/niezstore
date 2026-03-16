import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "../ui/button";

export default function ProductForm({
  form,
  categories,
  message,
  disabled,
  onChange,
  onSubmit,
  onSelectImages,
  pendingImagesCount,
  pendingImages = [],
  onRemovePendingImage,
}) {
  const categoryReady = Boolean(form.categoryId);
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const acceptedTypes = useMemo(() => ["image/jpeg", "image/png"], []);
  const acceptLabel = "image/jpeg,image/png";
  const acceptHint = "Solo JPG o PNG.";

  useEffect(() => {
    const next = pendingImages.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews(next);
    return () => {
      next.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [pendingImages]);

  const pushFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    const valid = incoming.filter((file) => acceptedTypes.includes(file.type));
    const invalidCount = incoming.length - valid.length;
    if (invalidCount > 0) {
      setUploadError(`${invalidCount} archivo(s) rechazados. ${acceptHint}`);
    } else {
      setUploadError("");
    }
    if (valid.length > 0) {
      onSelectImages?.(valid);
    }
  };

  const handleFileChange = (event) => {
    pushFiles(event.target.files);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    setIsDragging(false);
    pushFiles(event.dataTransfer?.files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    if (disabled) return;
    setIsDragging(false);
  };

  return (
    <article className="soft-card p-4 md:p-5">
      <h2 className="text-base font-bold text-slate-100">Crear producto</h2>
      <p className="mt-1 text-xs text-slate-400">
        Guarda el producto base y luego agrega opciones y variantes.
      </p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
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
        <div>
          <label className="text-xs text-slate-400">Imagenes del producto</label>
          <div className="mt-2">
            <input
              type="file"
              accept={acceptLabel}
              multiple
              ref={inputRef}
              onChange={handleFileChange}
              disabled={disabled}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`upload-drop group flex w-full items-center justify-center gap-3 rounded-xl px-4 py-6 text-sm ${
                isDragging ? "upload-drop--active" : ""
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-slate-950/60 text-lg text-cyan-300 transition group-hover:border-cyan-300 group-hover:text-cyan-200">
                +
              </span>
              <span className="text-left">
                <span className="block font-semibold text-slate-100">Subir imagenes</span>
                <span className="block text-xs text-slate-400">
                  Arrastra o haz click para seleccionar. {acceptHint}
                </span>
              </span>
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {pendingImagesCount
              ? `${pendingImagesCount} archivo(s) listos para subir.`
              : "Se subiran cuando guardes el producto."}
          </p>
          {uploadError ? (
            <p className="text-xs text-rose-300">{uploadError}</p>
          ) : null}
        </div>
        {previews.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {previews.map((item, index) => (
              <div
                key={`${item.file.name}-${item.file.lastModified}-${index}`}
                className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60"
              >
                <div className="relative h-32">
                  <Image
                    src={item.url}
                    alt={item.file.name}
                    fill
                    className="object-cover"
                    sizes="240px"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 p-2">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-slate-300">{item.file.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemovePendingImage?.(index)}
                  >
                    Quitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <Button type="submit" className="w-full" disabled={disabled || !categoryReady}>
          {disabled ? "Creando..." : "Crear producto"}
        </Button>
        {message ? <p className="text-xs text-cyan-300">{message}</p> : null}
      </form>
    </article>
  );
}
