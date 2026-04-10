"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import PageShell from "@/components/ui/page-shell";
import SectionCard from "@/components/ui/section-card";
import { Copy, UploadCloud, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INPUT_LIMITS } from "@/lib/input-limits";

export default function PaymentPage({ params }) {
  // `params` is a Promise in App Router for dynamic segments when using layout/page 
  const resolvedParams = use(params);
  const orderCode = resolvedParams.orderCode;
  
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > INPUT_LIMITS.receiptMaxBytes) {
        setError(`El archivo no puede pesar más de ${INPUT_LIMITS.receiptMaxBytes / 1024 / 1024}MB.`);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Debes subir un comprobante de transferencia para continuar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Get Cloudinary signature
      const signatureRes = await fetch("/api/uploads/cloudinary", {
        method: "POST",
        body: JSON.stringify({
          folder: INPUT_LIMITS.receiptCloudinaryFolder,
          formats: INPUT_LIMITS.receiptAllowedFormats,
        }),
      });
      const signature = await signatureRes.json();
      if (!signatureRes.ok) throw new Error(signature.error || "Error al conectar con el servidor de imágenes.");

      // 2. Upload to Cloudinary
      const cloudData = new FormData();
      cloudData.append("file", selectedFile);
      cloudData.append("api_key", signature.apiKey);
      cloudData.append("timestamp", signature.timestamp);
      cloudData.append("signature", signature.signature);
      cloudData.append("folder", signature.folder);
      cloudData.append("allowed_formats", signature.allowedFormats);

      // resource_type goes in the URL path (/auto/upload), not as a form field
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`,
        { method: "POST", body: cloudData }
      );
      const cloudJson = await cloudRes.json();
      if (!cloudRes.ok) throw new Error(cloudJson?.error?.message || "Error subiendo el archivo a la nube.");

      const receiptUrl = cloudJson.secure_url;

      // 3. Send URL to our backend
      const res = await fetch("/api/checkout/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode, receiptUrl }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar el pago");
      }

      router.push(`/checkout/success?order=${orderCode}`);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/checkout/payment/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cancelar la orden.");
      }
      
      router.push("/");
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <PageShell>
        <PageHeader title="Paso 2: Pago" description="Cargando..." />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Paso 2: Pago"
        description="Realiza la transferencia y sube el comprobante para confirmar tu compra."
      />

      <div className="flex flex-wrap gap-2 text-xs font-medium mb-6">
        <span className="rounded-full border border-cyan-400/50 bg-cyan-400/10 px-3 py-1 text-cyan-300">
          1. Datos
        </span>
        <span className="rounded-full bg-cyan-400 px-3 py-1 text-slate-950">
          2. Pago por Transferencia
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <SectionCard>
            <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
              Datos Bancarios
            </h2>
            <p className="text-sm text-[var(--muted)] mt-2 mb-6">
              Transfiere el monto exacto a la siguiente cuenta bancaria. 
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 relative group">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Banco</p>
                <p className="text-sm font-bold text-[var(--foreground)] mt-1">Banco Familiar</p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 relative group">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Titular</p>
                <p className="text-sm font-bold text-[var(--foreground)] mt-1">Niez Store SRL Comercial</p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 relative group">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Cuenta Nro</p>
                <p className="text-sm font-bold text-[var(--foreground)] mt-1" id="account-nro">0123456789</p>
                <button 
                  onClick={() => handleCopy("0123456789", "account")}
                  className="absolute top-4 right-4 text-[var(--muted)] hover:text-cyan-500 transition"
                  title="Copiar"
                >
                  {copied === "account" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 relative group">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">CI / RUC</p>
                <p className="text-sm font-bold text-[var(--foreground)] mt-1">80012345-6</p>
                <button 
                  onClick={() => handleCopy("80012345-6", "ruc")}
                  className="absolute top-4 right-4 text-[var(--muted)] hover:text-cyan-500 transition"
                  title="Copiar"
                >
                  {copied === "ruc" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="sm:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 relative group">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Alias</p>
                <p className="text-sm font-bold text-[var(--foreground)] mt-1">niez.store</p>
                <button 
                  onClick={() => handleCopy("niez.store", "alias")}
                  className="absolute top-4 right-4 text-[var(--muted)] hover:text-cyan-500 transition"
                  title="Copiar"
                >
                  {copied === "alias" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard as="aside" className="h-fit">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">Subir Comprobante</h2>
          <p className="text-sm text-[var(--muted)] mb-6">
            Una vez hecha la transferencia, sube la foto o captura de pantalla del comprobante para que podamos confirmar tu pedido.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-6 transition hover:bg-[var(--surface)] ${
                selectedFile ? "border-cyan-500/50 bg-cyan-500/10" : ""
              }`}
            >
              <input
                type="file"
                accept="image/*.jpg,image/*.jpeg,image/*.png,image/*.webp,application/pdf"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isSubmitting}
              />
              <div className="flex flex-col items-center gap-2 text-center">
                {selectedFile ? (
                  <>
                    <CheckCircle2 className="h-8 w-8 text-cyan-500" />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Archivo seleccionado:
                    </span>
                    <span className="text-xs text-[var(--muted)] break-all max-w-[250px] truncate">
                      {selectedFile.name}
                    </span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-[var(--muted)]" />
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      Click para subir
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      JPG, PNG, WEBP, PDF hasta 5MB
                    </span>
                  </>
                )}
              </div>
            </label>

            {error && (
              <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full"
              disabled={!selectedFile || isSubmitting}
            >
              {isSubmitting ? "Procesando..." : "Confirmar Pago"}
            </Button>
            
            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={isSubmitting}
              className="mt-2 text-sm text-[var(--muted)] hover:text-rose-400 font-medium transition text-center w-full focus:outline-none"
            >
              Cancelar pedido
            </button>
          </form>
        </SectionCard>
      </div>
    </PageShell>
  );
}
