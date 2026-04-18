import { useState } from "react";
import Link from "next/link";
import SectionCard from "@/components/ui/section-card";
import Pagination from "@/components/ui/pagination";
import { Package, Calendar, Search } from "lucide-react";

const formatPrice = (v) => Number(v || 0).toFixed(2);
const formatDate = (d) => new Intl.DateTimeFormat("es-PY", { dateStyle: "long" }).format(new Date(d));

const mapOrderStatus = (status) => {
  switch (status) {
    case 'PENDING_PAYMENT':
    case 'PENDING':
      return { label: 'PENDIENTE', style: 'status-pill--inactive' };
    case 'PAID':
      return { label: 'PAGADO', style: 'status-pill--active' };
    case 'PROCESSING':
      return { label: 'EN PROCESO', style: 'status-pill--info' };
    case 'SHIPPED':
      return { label: 'ENVIADO', style: 'status-pill--info' };
    case 'DELIVERED':
      return { label: 'ENTREGADO', style: 'status-pill--active' };
    case 'CANCELLED':
      return { label: 'CANCELADO', style: 'status-pill--danger' };
    case 'REFUNDED':
      return { label: 'REEMBOLSADO', style: 'status-pill--danger' };
    default:
      return { label: status || 'DESCONOCIDO', style: 'status-pill--inactive' };
  }
};

export default function AccountOrders({ orders = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const itemsPerPage = 5;

  const filteredOrders = searchQuery.trim()
    ? orders.filter((order) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          order.orderCode?.toLowerCase().includes(q) ||
          order.items?.some((item) => item.product?.name?.toLowerCase().includes(q))
        );
      })
    : orders;

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

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
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 mb-4">
        <h2 className="text-lg font-black text-[var(--foreground)] uppercase tracking-tight">Tus Pedidos</h2>
        <span className="text-[10px] font-bold bg-[var(--surface-soft)] px-2 py-1 rounded text-[var(--muted)] border border-[var(--border)]">
          {orders.length} totales
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)] pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por código o producto..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2.5 pl-9 pr-4 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition"
        />
      </div>

      {filteredOrders.length === 0 && searchQuery ? (
        <SectionCard className="py-10 text-center">
          <p className="text-sm text-[var(--muted)]">No se encontraron pedidos para <strong>&ldquo;{searchQuery}&rdquo;</strong>.</p>
        </SectionCard>
      ) : (
        <div className="grid gap-4">
          {currentOrders.map((order) => (
            <SectionCard key={order.id} className="admin-list-item p-4 group hover:border-[var(--accent)]/50 transition-all duration-300 cursor-default">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`status-pill px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${mapOrderStatus(order.status).style}`}>
                      {mapOrderStatus(order.status).label}
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
            
              <div className="mt-6 flex flex-wrap gap-2 pt-6 border-t border-[var(--border)]">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center rounded-lg bg-[var(--surface-soft)]/30 px-3 py-1.5 text-[10px] font-bold text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--accent)]/10 transition-colors max-w-[280px]" title={item.product.name}>
                     <span className="text-[var(--accent)] mr-2 flex-shrink-0">{item.quantity}x</span>
                     <span className="truncate min-w-0">{item.product.name}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={filteredOrders.length}
        pageSize={itemsPerPage}
        onPageChange={setCurrentPage}
        className="mt-6"
      />
    </div>
  );
}
