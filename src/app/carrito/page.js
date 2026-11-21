"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import PageShell from "@/components/ui/page-shell";
import PageHeader from "@/components/ui/page-header";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useMounted } from "@/lib/use-mounted";
import { getButtonClass } from "@/components/ui/button";
import QuantityControl from "@/components/ui/quantity-control";

const formatPrice = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "0.00";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getCartTotal } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <PageShell>
        <PageHeader title="Mi Carrito" description="Cargando tu carrito..." />
      </PageShell>
    );
  }

  const subtotal = getCartTotal();

  if (items.length === 0) {
    return (
      <PageShell>
        <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
          <Link href="/" className="hover:text-cyan-500 transition">Inicio</Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">Carrito</span>
        </div>

        <PageHeader title="Mi Carrito" />

        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/20 py-16 px-6 text-center">
          <div className="mb-4 rounded-full bg-[var(--surface-soft)] p-4">
            <ShoppingCart className="h-8 w-8 text-[var(--muted)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">Tu carrito está vacío</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Parece que aún no has agregado productos a tu carrito. ¡Revisá nuestro catálogo!
          </p>
          <Link
            href="/categorias"
            className="mt-6 inline-flex rounded-xl bg-cyan-400 px-8 py-3 text-sm font-bold text-[#000] transition hover:bg-cyan-300"
          >
            Explorar catálogo
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
        <Link href="/" className="hover:text-cyan-500 transition">Inicio</Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">Carrito</span>
      </div>

      <PageHeader title="Mi Carrito" description={`Tenés ${items.length} tipo(s) de producto en tu carrito.`} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px] items-start">
        {/* Cart Items */}
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.variant.id} className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/30 p-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[var(--surface)]">
                {item.variant.imageUrl ? (
                  <Image
                    src={item.variant.imageUrl}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--muted)]">Sin img</div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/producto/${item.product.slug || item.product.id}`}
                      className="font-bold text-base text-[var(--foreground)] hover:text-cyan-400 transition line-clamp-2"
                      style={{ overflowWrap: "anywhere" }}
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-[var(--muted)] mt-1 truncate">{item.variant.summary}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.variant.id, isAuthenticated)}
                    className="text-[var(--muted)] hover:text-rose-400 transition"
                    aria-label="Eliminar producto"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-end justify-between mt-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <QuantityControl
                      value={item.quantity}
                      onChange={(newQty) => updateQuantity(item.variant.id, newQty, isAuthenticated)}
                      max={typeof item.variant.stock === "number" ? item.variant.stock : 99}
                    />

                    <button
                      type="button"
                      onClick={() => removeItem(item.variant.id, isAuthenticated)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-400 transition hidden sm:block"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-extrabold text-[var(--foreground)]">${formatPrice(item.variant.price * item.quantity)}</p>
                    {item.quantity > 1 && (
                      <p className="text-[10px] text-[var(--muted)]">${formatPrice(item.variant.price)} c/u</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/20 p-6 sticky top-24">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-6">Resumen de cuenta</h2>

          <div className="flex justify-between text-sm text-[var(--foreground)] mb-4">
            <span>Subtotal</span>
            <span className="font-bold">${formatPrice(subtotal)}</span>
          </div>

          <div className="flex justify-between text-sm text-[var(--foreground)] mb-6 pb-6 border-b border-[var(--border)]">
            <span>Envío</span>
            <span className="text-[var(--muted)]">Calculado en checkout</span>
          </div>

          <div className="flex justify-between text-xl font-extrabold text-[var(--foreground)] mb-8">
            <span>Total estimado</span>
            <span>${formatPrice(subtotal)}</span>
          </div>

          <Link
            href="/checkout"
            className={getButtonClass({ size: "lg", className: "w-full text-sm font-bold gap-2" })}
          >
            Verificar y Pagar
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="mt-4 text-center text-[11px] text-[var(--muted)]">
            Los precios reales y el stock se validarán automáticamente en el siguiente paso.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
