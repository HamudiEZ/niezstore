"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import PageShell from "@/components/ui/page-shell";
import SectionCard from "@/components/ui/section-card";
import { Copy, UploadCloud, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button, getButtonClass } from "@/components/ui/button";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { useMounted } from "@/lib/use-mounted";
import { BANK_DETAILS } from "@/lib/payment-config";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export default function PaymentPage({ params }) {
  const resolvedParams = use(params);
  const orderCode = resolvedParams.orderCode;

  const router = useRouter();
  const mounted = useMounted();
  const [orderSummary, setOrderSummary] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let active = true;

    fetch(`/api/checkout/payment?orderCode=${encodeURIComponent(orderCode)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok || !data?.order) {
          setOrderError(data?.error || "No se pudo cargar la orden.");
        } else {
          setOrderSummary(data.order);
        }
      })
      .catch(() => {
        if (active) setOrderError("Error de red al verificar la orden.");
      })
      .finally(() => {
        if (active) setLoadingOrder(false);
      });

    return () => {
      active = false;
    };
  }, [orderCode]);

  const handleCopy = async (text, field) => {
    try {
      if (!navigator.clipboard?.writeText) return;
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      // Ignore clipboard rejection in restricted/insecure contexts
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (
      (file.type && !ALLOWED_MIME_TYPES.has(file.type)) ||
      (!file.type && !ALLOWED_EXTENSIONS.has(ext))
    ) {
      setError("Formato no soportado. Usa JPG, PNG, WEBP o PDF.");
      return;
    }

    if (file.size > INPUT_LIMITS.receiptMaxBytes) {
      setError(
        `El archivo no puede pesar más de ${INPUT_LIMITS.receiptMaxBytes / 1024 / 1024}MB.`
      );
      return;
    }
    setSelectedFile(file);
    setError(null);
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
      const signatureRes = await fetch("/api/uploads/cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder: INPUT_LIMITS.receiptCloudinaryFolder,
          orderCode,
        }),
      });
      const signature = await signatureRes.json().catch(() => ({}));
      if (!signatureRes.ok) {
        throw new Error(
          signature.error || "Error al conectar con el servidor de imágenes."
        );
      }

      const cloudData = new FormData();
      cloudData.append("file", selectedFile);
      cloudData.append("api_key", signature.apiKey);
      cloudData.append("timestamp", signature.timestamp);
      cloudData.append("signature", signature.signature);
      cloudData.append("folder", signature.folder);
      cloudData.append("allowed_formats", signature.allowedFormats);
      if (signature.publicId) {
        cloudData.append("public_id", signature.publicId);
      }

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`,
        { method: "POST", body: cloudData }
      );
      const cloudJson = await cloudRes.json().catch(() => ({}));
      if (!cloudRes.ok) {
        throw new Error(
          cloudJson?.error?.message || "Error subiendo el archivo a la nube."
        );
      }

      const receiptUrl = cloudJson.secure_url;

      const res = await fetch("/api/checkout/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode, receiptUrl }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar el pago");
      }

      router.push(`/checkout/success?order=${encodeURIComponent(orderCode)}`);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsSubmitting(true);
    setError(null);
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

  if (!mounted || loadingOrder) {
    return (
      <PageShell>
        <PageHeader title="Paso 2: Pago" description="Cargando detalles de tu orden..." />
      </PageShell>
    );
  }

  if (orderError || !orderSummary) {
    return (
      <PageShell>
        <PageHeader title="Paso 2: Pago" />
        <SectionCard className="mx-auto max-w-lg text-center py-10">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {orderError || "No pudimos encontrar esta orden."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/" className={getButtonClass()}>
              Volver al inicio
            </Link>
          </div>
        </SectionCard>
      </PageShell>
    );
  }

  if (orderSummary.status !== "PENDING_PAYMENT") {
    return (
      <PageShell>
        <PageHeader title="Paso 2: Pago" description={`Orden #${orderSummary.orderCode}`} />
        <SectionCard className="mx-auto max-w-lg text-center py-10">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-cyan-400" />
          <p className="text-base font-bold text-[var(--foreground)]">
            Esta orden ya no está pendiente de pago ({orderSummary.status}).
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/cuenta?tab=orders" className={getButtonClass()}>
              Ver mis pedidos
            </Link>
          </div>
        </SectionCard>
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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Orden #{orderSummary.orderCode}
                </p>
                <p className="mt-1 text-2xl font-black text-[var(--foreground)]">
                  Monto total: ${Number(orderSummary.totalAmount || 0).toFixed(2)}
                </p>
              </div>
              {orderSummary.hasReceipt && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                  Comprobante recibido (puedes reemplazarlo)
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
              Datos Bancarios
            </h2>
            <p className="text-sm text-[var(--muted)] mt-2 mb-6">
              Transfiere el monto exacto (${Number(orderSummary.totalAmount || 0).toFixed(2)}) a la siguiente cuenta bancaria.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 relative group">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Banco</p>
                <p className="text-sm font-bold text-[var(--foreground)] mt-1">{BANK_DETAILS.bank || "—"}</p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 relative group">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Titular</p>
                <p className="text-sm font-bold text-[var(--foreground)] mt-1">{BANK_DETAILS.holder || "—"}</p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 relative group">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Cuenta Nro</p>
                <p className="text-sm font-bold text-[var(--foreground)] mt-1" id="account-nro">{BANK_DETAILS.account || "—"}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(BANK_DETAILS.account, "account")}
                  className="absolute top-4 right-4 text-[var(--muted)] hover:text-cyan-500 transition"
                  title="Copiar"
                  disabled={!BANK_DETAILS.account}
                >
                  {copied === "account" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 relative group">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">CI / RUC</p>
                <p className="text-sm font-bold text-[var(--foreground)] mt-1">{BANK_DETAILS.ruc || "—"}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(BANK_DETAILS.ruc, "ruc")}
                  className="absolute top-4 right-4 text-[var(--muted)] hover:text-cyan-500 transition"
                  title="Copiar"
                  disabled={!BANK_DETAILS.ruc}
                >
                  {copied === "ruc" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              <div className="sm:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 relative group">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Alias</p>
                <p className="text-sm font-bold text-[var(--foreground)] mt-1">{BANK_DETAILS.alias || "—"}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(BANK_DETAILS.alias, "alias")}
                  className="absolute top-4 right-4 text-[var(--muted)] hover:text-cyan-500 transition"
                  title="Copiar"
                  disabled={!BANK_DETAILS.alias}
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
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
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
