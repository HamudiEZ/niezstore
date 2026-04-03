"use client";

import { useEffect, useState, useCallback } from "react";
import { Package, Search, Calendar, ChevronLeft, ChevronRight, User } from "lucide-react";

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?page=${page}&pageSize=10`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        setPagination(data.pagination);
      } else {
        setError(data.error || "Error al cargar pedidos");
      }
    } catch (err) {
      setError("Error de red al cargar pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const formatPrice = (v) => Number(v || 0).toFixed(2);
  const formatDate = (d) => new Intl.DateTimeFormat("es-PY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));

  if (loading) return <div className="p-8 text-center text-sm text-[var(--muted)]">Cargando historial de ventas...</div>;
  if (error) return <div className="p-8 text-center text-[var(--admin-danger)] text-sm">{error}</div>;

  return (
    <div className="space-y-4">
      
      {/* Search Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
        <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
          Gestion de Ventas
          <span className="text-[11px] font-normal text-[var(--muted)]">Ultimos pedidos realizados</span>
        </h2>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center admin-empty">
          <Package className="mx-auto h-12 w-12 text-[var(--muted)] mb-4" />
          <p className="text-[var(--muted)] text-sm font-medium">No se han registrado ventas todavía.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <div key={order.id} className="admin-list-item p-4 hover:border-[var(--accent)]/50 transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--foreground)]">ORDEN #{order.orderCode}</span>
                      <span className={`status-pill px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        order.status === 'PAID' ? 'status-pill--active' : 'status-pill--inactive'
                      }`}>
                        {order.status === 'PAID' ? 'PAGADO' : 'PENDIENTE'}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--muted)] font-medium">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-[var(--muted)]">Total venta</p>
                  <p className="text-lg font-black text-[var(--foreground)]">${formatPrice(order.totalAmount)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-[var(--border)] text-[var(--muted)]">
                <div className="flex items-center gap-1.5 text-xs">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-[var(--foreground)] font-medium">{order.customerName}</span>
                  <span className="opacity-50">({order.customerEmail})</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs ml-auto">
                   <span className="opacity-50">Items:</span>
                   <span className="text-[var(--foreground)]">{order.items.length} productos</span>
                </div>
              </div>

              {/* Items Preview */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                 {order.items.map((item, idx) => (
                   <span key={idx} className="bg-[var(--surface-soft)]/40 px-2 py-0.5 rounded text-[9px] text-[var(--muted)] border border-[var(--border)]">
                      {item.quantity}x {item.product.name}
                   </span>
                 ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button 
            disabled={pagination.page <= 1}
            onClick={() => fetchOrders(pagination.page - 1)}
            className="pagination-btn disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex h-8 items-center px-4 rounded-lg bg-[var(--surface-soft)] text-xs font-bold text-[var(--foreground)] border border-[var(--border)]">
            Pagina {pagination.page} de {pagination.totalPages}
          </div>
          <button 
             disabled={pagination.page >= pagination.totalPages}
             onClick={() => fetchOrders(pagination.page + 1)}
             className="pagination-btn disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
