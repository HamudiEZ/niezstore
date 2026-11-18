"use client";

import { useState, useEffect, useCallback } from "react";
import AdminSectionCard from "./AdminSectionCard";
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  PackageX,
  MessageCircle,
  Loader2,
  RotateCcw,
} from "lucide-react";

const formatPrice = (v) =>
  Number(v || 0).toLocaleString("es-PY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatDate = (d) =>
  new Intl.DateTimeFormat("es-PY", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(d));

function normalizeWhatsappDigits(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0") && digits.length >= 9) {
    return `595${digits.slice(1)}`;
  }
  return digits;
}

function DashboardCard({ title, value, icon: Icon, description, isWarning }) {
  return (
    <div
      className={`p-4 rounded-2xl border ${
        isWarning
          ? "border-rose-500/30 bg-rose-500/5"
          : "border-[var(--border)] bg-[var(--surface-soft)]"
      } flex flex-col`}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-2 rounded-lg ${
            isWarning
              ? "bg-rose-500/10 text-rose-500"
              : "bg-[var(--accent)]/10 text-[var(--accent)]"
          } flex-shrink-0`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-black text-[var(--foreground)] truncate">
          {value}
        </p>
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mt-1">
          {title}
        </p>
        {description && (
          <p className="text-[10px] text-[var(--muted)]/70 mt-1 truncate">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function SimpleBarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-[var(--muted)] text-sm">
        Sin datos
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="h-48 min-w-[420px] flex items-end gap-1.5 pt-4">
        {data.map((item, idx) => {
          const heightPercent = (item.revenue / maxRevenue) * 100;
          const isToday = idx === data.length - 1;
          const [, month = "", day = ""] = String(item.date || "").split("-");
          const dateLabel = day && month ? `${day}/${month}` : item.date;

          return (
            <div
              key={item.date}
              className="group relative flex-1 flex flex-col items-center justify-end h-full min-w-[10px]"
            >
              <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--foreground)] text-[var(--surface)] text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 flex flex-col items-center">
                <span className="font-bold">${formatPrice(item.revenue)}</span>
                <span className="opacity-70">{dateLabel}</span>
              </div>

              <div
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
                className={`w-full rounded-t-sm transition-all duration-300 ${
                  isToday
                    ? "bg-[var(--accent)]"
                    : "bg-[var(--accent)]/30 hover:bg-[var(--accent)]/60"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardTab({
  onNavigateToOrders,
  onNavigateToProduct,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const payload = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(payload?.error || "Error al cargar métricas");
      }
      setData(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--muted)]">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest">
          Recolectando Métricas...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
        <p className="text-rose-500 font-bold">{error || "Error desconocido"}</p>
        <button
          type="button"
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-text)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  const { metrics, actionable, salesTrend } = data;
  const abandonedCount =
    actionable.abandonedTotalCount ?? actionable.abandoned.length;

  const handleWhatsApp = (phone, name) => {
    const digits = normalizeWhatsappDigits(phone);
    if (!digits) return;
    const msg = encodeURIComponent(
      `Hola ${name}, vimos que iniciaste un pedido en Niez Store pero quedó pendiente. ¿Tuviste algún inconveniente?`
    );
    window.open(
      `https://wa.me/${digits}?text=${msg}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashboardCard
          title="Ingresos Totales"
          value={`$${formatPrice(metrics.totalRevenue)}`}
          icon={DollarSign}
          description={`${metrics.paidOrdersCount} pedidos pagados`}
        />
        <DashboardCard
          title="Ticket Promedio"
          value={`$${formatPrice(metrics.averageOrderValue)}`}
          icon={TrendingUp}
          description="Gasto prom. por pedido"
        />
        <DashboardCard
          title="Por Verificar"
          value={actionable.toVerify.length}
          icon={Clock}
          isWarning={actionable.toVerify.length > 0}
          description="Esperando tu revisión"
        />
        <DashboardCard
          title="Abandonados"
          value={abandonedCount}
          icon={MessageCircle}
          description="Para contactar manual"
        />
      </div>

      <AdminSectionCard title="Ventas Últimos 30 días">
        <p className="text-xs text-[var(--muted)] mb-2">
          Histórico de ingresos diarios de pedidos completados (hora Paraguay).
        </p>
        <SimpleBarChart data={salesTrend} />
        <div className="flex justify-between text-[10px] text-[var(--muted)] mt-2 font-bold uppercase tracking-widest px-1">
          <span>Hace 30 días</span>
          <span>Hoy</span>
        </div>
      </AdminSectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <AdminSectionCard
            title="Pagos por Verificar"
            actions={
              <span className="bg-amber-500/20 text-amber-500 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                {actionable.toVerify.length} Urgentes
              </span>
            }
          >
            {actionable.toVerify.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[var(--muted)]">
                  Todo verificado. No hay pagos pendientes.
                </p>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {actionable.toVerify.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-[var(--muted)]">
                          #{order.orderCode}
                        </span>
                        <span className="text-xs font-bold text-[var(--foreground)] truncate">
                          {order.customerName}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--muted)]">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                      <span className="font-black text-[var(--foreground)]">
                        ${formatPrice(order.totalAmount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateToOrders(order.orderCode)}
                        className="btn-ui btn-ui--outline px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AdminSectionCard>

          {actionable.abandoned.length > 0 && (
            <AdminSectionCard title="Carritos Recuperables">
              <p className="text-xs text-[var(--muted)] mb-4">
                Iniciaron checkout pero no subieron comprobante.
              </p>
              <div className="space-y-2">
                {actionable.abandoned.slice(0, 5).map((order) => {
                  const hasWhatsapp = Boolean(normalizeWhatsappDigits(order.customerPhone));
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-bold text-[var(--foreground)] truncate">
                          {order.customerName}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--muted)]">
                          #{order.orderCode}
                        </p>
                      </div>
                      {hasWhatsapp ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleWhatsApp(order.customerPhone, order.customerName)
                          }
                          className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors"
                          title="Escribir al WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-[var(--muted)] italic">
                          Sin Teléfono
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {abandonedCount > 5 && (
                <button
                  type="button"
                  onClick={() => onNavigateToOrders("orders")}
                  className="w-full mt-3 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:underline"
                >
                  Ver todos los {abandonedCount} pendientes
                </button>
              )}
            </AdminSectionCard>
          )}
        </div>

        <AdminSectionCard
          title="Alerta de Stock"
          actions={
            <span className="bg-rose-500/10 text-rose-500 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
              {actionable.lowStock.length} Críticos
            </span>
          }
        >
          {actionable.lowStock.length === 0 ? (
            <div className="text-center py-6">
              <PackageX className="h-8 w-8 text-[var(--muted)]/30 mx-auto mb-2" />
              <p className="text-xs text-[var(--muted)]">
                El inventario está sano. Sin alertas.
              </p>
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {actionable.lowStock.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <p
                      className="text-xs font-bold text-[var(--foreground)] truncate"
                      title={variant.product?.name}
                    >
                      {variant.product?.name || "Producto"}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] font-mono text-[var(--muted)] bg-[var(--surface)] px-1.5 rounded">
                        {variant.sku || "SIN SKU"}
                      </span>
                      <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] px-1.5 rounded truncate">
                        {variant.optionLabel || "Base"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 gap-2">
                    <div className="flex flex-col items-end leading-none">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1">
                        Stock
                      </span>
                      <span
                        className={`text-lg font-black ${
                          variant.stock === 0 ? "text-rose-500" : "text-amber-500"
                        }`}
                      >
                        {variant.stock}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateToProduct(variant.productId)}
                      className="btn-ui btn-ui--outline px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg mt-1 w-full text-center"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminSectionCard>
      </div>
    </div>
  );
}
