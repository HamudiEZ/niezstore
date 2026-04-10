"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import PageShell from "@/components/ui/page-shell";
import SectionCard from "@/components/ui/section-card";
import { useCartStore } from "@/store/cartStore";
import {
  sanitizePhoneInput,
  sanitizePostalCodeInput,
  sanitizeNameInput,
  validateCheckoutFormData,
} from "@/lib/checkout-validation";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { MapPin } from "lucide-react";

const formatPrice = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "0.00";

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-[var(--admin-danger)]">{message}</p>;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    line1: "",
    city: "",
    postalCode: "",
  });

  // Saved addresses for logged-in users
  const [savedAddresses, setSavedAddresses] = useState([]);

  useEffect(() => {
    setMounted(true);
    // Try to load saved addresses (only succeeds if user is logged in)
    fetch("/api/user/addresses")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.addresses) setSavedAddresses(data.addresses); })
      .catch(() => {});
  }, []);

  const validation = useMemo(() => validateCheckoutFormData(formData), [formData]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;

    if (name === "phone") {
      nextValue = sanitizePhoneInput(value);
    } else if (name === "postalCode") {
      nextValue = sanitizePostalCodeInput(value);
    } else if (name === "fullName" || name === "city") {
      nextValue = sanitizeNameInput(value);
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleCheckout = async (event) => {
    event.preventDefault();
    if (items.length === 0) return;

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setError("Revisa los campos marcados para continuar.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    const payload = {
      items: items.map((item) => ({
        variantId: item.variant.id,
        quantity: item.quantity,
      })),
      customer: {
        fullName: validation.normalized.fullName,
        email: validation.normalized.email,
        phone: validation.normalized.phone,
      },
      shipping: {
        line1: validation.normalized.line1,
        city: validation.normalized.city,
        postalCode: validation.normalized.postalCode,
      },
    };

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data?.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        throw new Error(data.error || "Ocurrio un error al procesar el pago");
      }

      clearCart();
      router.push(`/checkout/pago/${data.orderCode}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <PageShell>
        <PageHeader title="Checkout" description="Cargando..." />
      </PageShell>
    );
  }

  if (items.length === 0) {
    return (
      <PageShell>
        <PageHeader title="Checkout" />
        <div className="flex flex-col items-center py-12">
          <h2 className="mb-4 text-xl font-bold text-[var(--foreground)]">
            No hay productos para pagar
          </h2>
          <Link href="/categorias">
            <Button>Volver a la tienda</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const subtotal = getCartTotal();

  return (
    <PageShell>
      <PageHeader
        title="Checkout"
        description="Completa direccion, envio y pago para confirmar tu pedido."
      />

      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-full bg-cyan-400 px-3 py-1 text-slate-950">1. Datos</span>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[var(--muted)]">
          2. Pago de Prueba
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <SectionCard>
          <form onSubmit={handleCheckout} id="checkout-form">
            {/* Saved address picker — only rendered when user has saved addresses */}
            {savedAddresses.length > 0 && (
              <div className="mb-6 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Usar dirección guardada</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        fullName: prev.fullName || addr.receiver,
                        line1: addr.line1,
                        city: addr.city,
                        postalCode: addr.postalCode || "",
                      }))}
                      className="text-left rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-all"
                    >
                      <p className="font-bold text-[var(--foreground)] truncate">{addr.label || addr.receiver}</p>
                      <p className="text-[var(--muted)] truncate mt-0.5">{addr.line1}, {addr.city}</p>
                      {addr.isDefault && (
                        <span className="text-[9px] font-black text-[var(--accent)] uppercase tracking-widest">★ Predeterminada</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-sm font-semibold text-[var(--foreground)]">Datos del cliente</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <input
                  required
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  maxLength={INPUT_LIMITS.checkoutFullName}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400"
                  placeholder="Nombre completo"
                />
                <FieldError message={fieldErrors.fullName} />
              </div>

              <div>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400"
                  placeholder="Correo electronico"
                />
                <FieldError message={fieldErrors.email} />
              </div>

              <div className="md:col-span-2">
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={22}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400"
                  placeholder="Telefono (opcional). Ej: +595 981 123456"
                />
                <FieldError message={fieldErrors.phone} />
              </div>
            </div>

            <h2 className="mt-6 text-sm font-semibold text-[var(--foreground)]">Direccion de envio</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <input
                  required
                  name="line1"
                  value={formData.line1}
                  onChange={handleInputChange}
                  maxLength={INPUT_LIMITS.checkoutLine1}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400"
                  placeholder="Direccion exacta"
                />
                <FieldError message={fieldErrors.line1} />
              </div>

              <div>
                <input
                  required
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  maxLength={INPUT_LIMITS.checkoutCity}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400"
                  placeholder="Ciudad"
                />
                <FieldError message={fieldErrors.city} />
              </div>

              <div>
                <input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={10}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400"
                  placeholder="Codigo postal"
                />
                <FieldError message={fieldErrors.postalCode} />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-500/50 bg-rose-500/10 p-4 text-sm text-rose-400">
                {error}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-2">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Procesando de forma segura..." : "Confirmar pedido"}
              </Button>
              <Link href="/carrito">
                <Button type="button" size="lg" variant="outline" disabled={isSubmitting}>
                  Volver al carrito
                </Button>
              </Link>
            </div>
          </form>
        </SectionCard>

        <SectionCard as="aside" className="h-fit">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Resumen de orden</h2>

          <div className="mb-4 mt-4 max-h-[300px] space-y-4 overflow-auto pr-2">
            {items.map((item) => (
              <div key={item.variant.id} className="flex justify-between text-sm">
                <div className="flex gap-2">
                  <span className="font-bold text-[var(--foreground)]">{item.quantity}x</span>
                  <span className="line-clamp-1 max-w-[150px] text-[var(--muted)]">
                    {item.product.name}
                  </span>
                </div>
                <span className="font-bold text-[var(--foreground)]">
                  ${formatPrice(item.variant.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Envio</span>
              <span>Gratis</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2 text-lg font-extrabold text-[var(--foreground)]">
              <span>Total</span>
              <span>${formatPrice(subtotal)}</span>
            </div>
          </div>
          <p className="mt-4 text-center text-[10px] leading-tight text-[var(--muted)]">
            Los precios se validan automaticamente con el servidor para tu seguridad.
          </p>
        </SectionCard>
      </div>
    </PageShell>
  );
}
