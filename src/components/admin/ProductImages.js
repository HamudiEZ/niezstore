import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "../ui/button";

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
      onUpload?.(valid);
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
      <div>
        <h3 className="text-sm font-semibold admin-title">Imagenes</h3>
        <p className="mt-1 text-xs admin-subtitle">
          Sube una o varias imagenes del producto (JPG/PNG).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
              Arrastra o haz click para seleccionar. {acceptHint}
            </span>
          </span>
        </button>
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
