import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "../ui/button";

const MAX_IMAGES = 5;

export default function ProductImages({
  images,
  onUpload,
  onRemove,
  disabled,
  message,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const acceptedTypes = useMemo(() => ["image/jpeg", "image/png"], []);
  const acceptLabel = "image/jpeg,image/png";
  const acceptHint = "Solo JPG o PNG.";
  const currentCount = images?.length ?? 0;
  const remaining = Math.max(0, MAX_IMAGES - currentCount);
  const isAtLimit = remaining === 0;

  const pushFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;
    const typeValid = incoming.filter((file) => acceptedTypes.includes(file.type));
    const invalidCount = incoming.length - typeValid.length;
    const allowed = typeValid.slice(0, remaining);
    const overLimit = typeValid.length - allowed.length;
    const errors = [];
    if (invalidCount > 0) errors.push(`${invalidCount} archivo(s) rechazados. ${acceptHint}`);
    if (overLimit > 0) errors.push(`Limite de ${MAX_IMAGES} imagenes alcanzado. ${overLimit} imagen(es) omitida(s).`);
    setUploadError(errors.join(" "));
    if (allowed.length > 0) {
      onUpload?.(allowed);
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold admin-title">Imagenes</h3>
          <p className="mt-1 text-xs admin-subtitle">
            Sube hasta {MAX_IMAGES} imagenes del producto (JPG/PNG).
          </p>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          isAtLimit
            ? "bg-rose-500/15 text-rose-400"
            : "bg-slate-800 text-slate-400"
        }`}>
          {currentCount}/{MAX_IMAGES}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept={acceptLabel}
          multiple
          ref={inputRef}
          onChange={handleFileChange}
          disabled={disabled || isAtLimit}
          className="sr-only"
        />
        {isAtLimit ? (
          <p className="admin-message admin-message--error w-full text-center">
            Limite de {MAX_IMAGES} imagenes alcanzado. Elimina una para subir más.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`upload-drop group flex w-full items-center justify-center gap-3 rounded-xl px-4 py-5 text-sm ${
              isDragging ? "upload-drop--active" : ""
            }`}
          >
            <span className="admin-upload-icon flex h-10 w-10 items-center justify-center rounded-full text-lg transition">
              +
            </span>
            <span className="text-left">
              <span className="block font-semibold admin-title">Subir imagenes</span>
              <span className="block text-xs admin-subtitle">
                Arrastra o haz click. {acceptHint} Quedan {remaining} espacio(s).
              </span>
            </span>
          </button>
        )}
        {message ? <p className="admin-message">{message}</p> : null}
        {uploadError ? <p className="admin-message admin-message--error">{uploadError}</p> : null}
      </div>

      {images?.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="admin-list-item relative overflow-hidden">
              <div className="relative h-32">
                <Image
                  src={image.url}
                  alt="Producto"
                  fill
                  className="object-cover"
                  sizes="180px"
                />
              </div>
              <div className="flex items-center justify-between p-2">
                <span className="text-[11px] admin-subtitle">#{image.position + 1}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(image.id)}
                  disabled={disabled}
                >
                  Quitar
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs admin-subtitle">Sin imagenes cargadas.</p>
      )}
    </div>
  );
}
