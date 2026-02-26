import Image from "next/image";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { products } from "../../lib/dummy-data";

export default function CartPage() {
  const cartItems = products.slice(0, 2).map((item) => ({ ...item, quantity: 1 }));
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Carrito</h1>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="soft-card p-4 md:p-5">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <article key={item.id} className="flex gap-3 border-b border-slate-700 pb-4 last:border-b-0 last:pb-0">
                <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-slate-800">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
                </div>
                <div className="flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-100">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500">Vendido por Niez Store</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-base font-extrabold text-slate-100">${item.price.toFixed(2)}</span>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300">
                      <button type="button">-</button>
                      <span>{item.quantity}</span>
                      <button type="button">+</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="soft-card h-fit p-4 md:p-5">
          <h2 className="text-sm font-semibold text-slate-100">Resumen</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Envio</span>
              <span>Gratis</span>
            </div>
          </div>
          <div className="mt-3 border-t border-slate-700 pt-3">
            <div className="flex justify-between text-base font-extrabold text-slate-100">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
          </div>

          <Link href="/checkout" className="mt-4 block">
            <Button size="lg" className="w-full">
              Proceder al pago
            </Button>
          </Link>

          <p className="mt-2 text-xs text-slate-500">Checkout de demostracion UI-only.</p>
        </aside>
      </div>
    </div>
  );
}
