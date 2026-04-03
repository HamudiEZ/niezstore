"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import PageShell from "@/components/ui/page-shell";
import SectionCard from "@/components/ui/section-card";
import { useCartStore } from "@/store/cartStore";

const formatPrice = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "0.00";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    line1: "",
    city: "",
    postalCode: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    const payload = {
      items: items.map(item => ({
        variantId: item.variant.id,
        quantity: item.quantity
      })),
      customer: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone
      },
      shipping: {
        line1: formData.line1,
        city: formData.city,
        postalCode: formData.postalCode,
      }
    };

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error al procesar el pago");
      }

      clearCart();
      router.push(`/checkout/success?order=${data.orderCode}`);

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
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">No hay productos para pagar</h2>
          <Link href="/categorias">
            <Button>Volver a la tienda</Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const subtotal = getCartTotal();
  const isFormValid = formData.fullName && formData.email && formData.line1 && formData.city;

  return (
    <PageShell>
      <PageHeader
        title="Checkout"
        description="Completa dirección, envío y pago para confirmar tu pedido."
      />

      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-full bg-cyan-400 px-3 py-1 text-slate-950">1. Datos</span>
        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[var(--muted)]">2. Pago de Prueba</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr] mt-6">
        <SectionCard>
          <form onSubmit={handleCheckout} id="checkout-form">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Datos del cliente</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400 transition"
                placeholder="Nombre completo"
              />
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400 transition"
                placeholder="Correo electrónico"
              />
              <input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400 transition md:col-span-2"
                placeholder="Teléfono (Opcional)"
              />
            </div>

            <h2 className="mt-6 text-sm font-semibold text-[var(--foreground)]">Dirección de envío</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <input
                required
                name="line1"
                value={formData.line1}
                onChange={handleInputChange}
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400 transition md:col-span-2"
                placeholder="Dirección exacta"
              />
              <input
                required
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400 transition"
                placeholder="Ciudad"
              />
              <input
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="h-11 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-cyan-400 transition"
                placeholder="Código postal"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-500/50 bg-rose-500/10 p-4 text-sm text-rose-400">
                {error}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-2">
              <Button type="submit" size="lg" disabled={!isFormValid || isSubmitting}>
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
          
          <div className="mt-4 mb-4 space-y-4 max-h-[300px] overflow-auto pr-2">
            {items.map((item) => (
              <div key={item.variant.id} className="flex justify-between text-sm">
                <div className="flex gap-2">
                  <span className="font-bold text-[var(--foreground)]">{item.quantity}x</span>
                  <span className="text-[var(--muted)] line-clamp-1 max-w-[150px]">{item.product.name}</span>
                </div>
                <span className="font-bold text-[var(--foreground)]">${formatPrice(item.variant.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2 text-sm text-[var(--muted)] border-t border-[var(--border)] pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
               <span>Envío</span>
              <span>Gratis</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] mt-2 pt-2 text-lg font-extrabold text-[var(--foreground)]">
              <span>Total</span>
              <span>${formatPrice(subtotal)}</span>
            </div>
          </div>
          <p className="mt-4 text-[10px] text-[var(--muted)] text-center leading-tight">
            Los precios se validan automáticamente con el servidor para tu seguridad.
          </p>
        </SectionCard>
      </div>
    </PageShell>
  );
}
