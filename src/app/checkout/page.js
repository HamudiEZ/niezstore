import Link from "next/link";
import { Button } from "../../components/ui/button";

export default function CheckoutPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Checkout</h1>

      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <span className="rounded-full bg-cyan-400 px-3 py-1 text-slate-950">1. Direccion</span>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">2. Envio</span>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">3. Pago</span>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">4. Revision</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="soft-card p-4 md:p-5">
          <h2 className="text-sm font-semibold text-slate-100">Datos de envio</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input className="h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100" placeholder="Nombre completo" />
            <input className="h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100" placeholder="Telefono" />
            <input className="h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 md:col-span-2" placeholder="Direccion" />
            <input className="h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100" placeholder="Ciudad" />
            <input className="h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100" placeholder="Codigo postal" />
          </div>

          <h2 className="mt-5 text-sm font-semibold text-slate-100">Metodo de pago</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <button type="button" className="rounded-xl border border-cyan-400 bg-cyan-400/20 p-3 text-left text-sm font-semibold text-cyan-300">
              Tarjeta de credito/debito
            </button>
            <button type="button" className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-left text-sm font-semibold text-slate-300">
              Efectivo / Pago local
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="lg">Confirmar pedido</Button>
            <Link href="/carrito">
              <Button size="lg" variant="outline">
                Volver al carrito
              </Button>
            </Link>
          </div>
        </section>

        <aside className="soft-card h-fit p-4 md:p-5">
          <h2 className="text-sm font-semibold text-slate-100">Resumen de orden</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-400">
            <div className="flex justify-between">
              <span>Productos</span>
              <span>$1,044.99</span>
            </div>
            <div className="flex justify-between">
              <span>Envio</span>
              <span>Gratis</span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-2 font-extrabold text-slate-100">
              <span>Total</span>
              <span>$1,044.99</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">No se procesa pago real en esta demo.</p>
        </aside>
      </div>
    </div>
  );
}
