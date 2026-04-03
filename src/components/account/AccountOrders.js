import Link from "next/link";
import SectionCard from "@/components/ui/section-card";
import { Package, Calendar, ChevronRight } from "lucide-react";

const formatPrice = (v) => Number(v || 0).toFixed(2);
const formatDate = (d) => new Intl.DateTimeFormat("es-PY", { dateStyle: "long" }).format(new Date(d));

export default function AccountOrders({ orders = [] }) {
  if (orders.length === 0) {
    return (
      <SectionCard className="py-16 text-center admin-empty">
        <Package className="mx-auto h-12 w-12 text-[var(--muted)] mb-4" />
        <h3 className="text-lg font-bold text-[var(--foreground)] uppercase tracking-tight">Sin pedidos aún</h3>
        <p className="mt-2 text-sm text-[var(--muted)] mb-8">
          Parece que todavía no has realizado ninguna compra con nosotros.
        </p>
        <Link 
          href="/categorias" 
          className="btn-ui btn-ui--primary px-8 py-3 text-sm font-bold uppercase rounded-xl inline-block"
        >
          Explorar catálogo
        </Link>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2 mb-4">
        <h2 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tight">Tus Pedidos</h2>
        <span className="text-[10px] font-bold bg-[var(--surface-soft)] px-2 py-1 rounded text-[var(--muted)] border border-[var(--border)]">
          {orders.length} pedidos
        </span>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <SectionCard key={order.id} className="admin-list-item p-4 group hover:border-[var(--accent)]/50 transition-all duration-300 cursor-default">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`status-pill px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    order.status === 'PAID' ? 'status-pill--active' : 'status-pill--inactive'
                  }`}>
                    {order.status === 'PAID' ? 'PAGO CONFIRMADO' : 'PENDIENTE'}
                  </span>
                  <span className="text-[11px] font-mono text-[var(--muted)] opacity-60">#{order.orderCode}</span>
                </div>
                
                <div className="flex items-center gap-5 text-xs text-[var(--muted)]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5 opacity-40 text-[var(--accent)]" />
                    {formatDate(order.createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Package className="h-3.5 w-3.5 opacity-40 text-[var(--accent)]" />
                    {order.items.length} productos
                  </span>
                </div>
              </div>

              <div className="text-right sm:border-l border-[var(--border)] sm:pl-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1">Monto total</p>
                <p className="text-2xl font-black text-[var(--foreground)]">${formatPrice(order.totalAmount)}</p>
              </div>
            </div>
            
            {/* Minimal Items Preview */}
            <div className="mt-6 flex flex-wrap gap-2 pt-6 border-t border-[var(--border)]">
              {order.items.map((item, idx) => (
                <div key={idx} className="rounded-lg bg-[var(--surface-soft)]/30 px-3 py-1.5 text-[10px] font-bold text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--accent)]/10 transition-colors">
                   <span className="text-[var(--accent)] mr-2">{item.quantity}x</span>
                   <span>{item.product.name}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
