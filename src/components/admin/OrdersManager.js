"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  BadgeDollarSign,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Funnel,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Truck,
  User,
  Download
} from "lucide-react";
import { INPUT_LIMITS } from "@/lib/input-limits";
import Pagination from "@/components/ui/pagination";

const STATUS_FILTERS = [
  { value: "all", label: "Todos los estados" },
  { value: "PENDING", label: "Pendiente de pago" },
  { value: "PAID", label: "Pagado" },
  { value: "PROCESSING", label: "En proceso" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
];

const STATUS_LABELS = {
  PAID: "Pagado",
  PENDING: "Pendiente",
  PENDING_PAYMENT: "Pendiente de pago",
  PROCESSING: "En proceso",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const ORDER_STATUS_OPTIONS = [
  { value: "PENDING_PAYMENT", label: "Pendiente de pago" },
  { value: "PAID", label: "Pagado" },
  { value: "PROCESSING", label: "En proceso" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
];

const STATUS_TRANSITIONS = {
  PENDING_PAYMENT: ["PENDING_PAYMENT", "PAID", "CANCELLED"],
  PAID: ["PAID", "PROCESSING", "CANCELLED"],
  PROCESSING: ["PROCESSING", "SHIPPED", "CANCELLED"],
  SHIPPED: ["SHIPPED", "DELIVERED"],
  DELIVERED: ["DELIVERED"],
  CANCELLED: ["CANCELLED"],
};

const FILTER_STATUS_MAP = {
  all: null,
  PAID: ["PAID"],
  PENDING: ["PENDING_PAYMENT", "PENDING"],
};

function isPendingStatus(status) {
  return FILTER_STATUS_MAP.PENDING.includes(status);
}

function normalizeOrderStatus(status) {
  if (status === "PENDING") return "PENDING_PAYMENT";
  return status;
}

function getAllowedStatusOptions(currentStatus) {
  const normalizedStatus = normalizeOrderStatus(currentStatus);
  const allowedStatuses = STATUS_TRANSITIONS[normalizedStatus] || [normalizedStatus];
  return ORDER_STATUS_OPTIONS.filter((option) => allowedStatuses.includes(option.value));
}

function getStatusLabel(status) {
  if (!status) return "Sin estado";
  return STATUS_LABELS[status] || status;
}

function getStatusClass(status) {
  if (status === "PAID" || status === "DELIVERED") {
    return "status-pill status-pill--active";
  }
  if (status === "CANCELLED" || status === "REFUNDED") {
    return "status-pill status-pill--danger";
  }
  if (status === "PROCESSING" || status === "SHIPPED") {
    return "status-pill status-pill--info";
  }
  if (isPendingStatus(status)) {
    return "status-pill status-pill--inactive";
  }
  return "status-pill status-pill--inactive";
}

/**
 * Transforms a Cloudinary URL to always serve a flattened JPG version
 * for security (neutralizes PDF scripts/XSS) and compatibility.
 */
const getSafeReceiptUrl = (url) => {
  if (!url) return "";
  if (typeof url === "string" && url.includes("cloudinary.com")) {
    // Inject f_jpg,pg_1 after /upload/
    return url.replace("/upload/", "/upload/f_jpg,pg_1/");
  }
  return url;
};

export default function OrdersManager({ initialSearch = "", onClearInitialSearch }) {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusDrafts, setStatusDrafts] = useState({});
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusMessageTone, setStatusMessageTone] = useState("info");
  const [expandedOrderId, setExpandedOrderId] = useState("");

  const fetchOrders = useCallback(async (page = 1, options = {}) => {
    const { silent = false } = options;
    if (!silent) {
      setLoading(true);
    }
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "10",
      });
      const normalizedSearch = searchTerm.trim();
      if (normalizedSearch) {
        params.set("search", normalizedSearch);
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        const nextOrders = data.orders || [];
        setOrders(nextOrders);
        setStatusDrafts(() => {
          const nextDrafts = {};
          for (const order of nextOrders) {
            const normalizedStatus = normalizeOrderStatus(order.status);
            nextDrafts[order.id] = normalizedStatus;
          }
          return nextDrafts;
        });
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
        setError("");
      } else {
        setError(data.error || "Error al cargar pedidos");
      }
    } catch {
      setError("Error de red al cargar pedidos");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [searchTerm, statusFilter]);

  const exportToCSV = async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "1000", // Fetch up to 1000 records for export
      });
      const normalizedSearch = searchTerm.trim();
      if (normalizedSearch) params.set("search", normalizedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.orders) throw new Error("No se pudo exportar.");

      const exportData = data.orders.map(order => ({
        ID: order.orderCode,
        Fecha: new Date(order.createdAt).toLocaleDateString("es-PY"),
        Cliente: order.customerName,
        Email: order.customerEmail,
        Telefono: order.customerPhone || "N/A",
        Estado: STATUS_LABELS[order.status] || order.status,
        Metodo: order.payments?.[0]?.provider || "N/A",
        Monto_Total: Number(order.totalAmount).toFixed(2)
      }));

      const headers = Object.keys(exportData[0] || {}).join(";");
      const rows = exportData.map(obj => Object.values(obj).map(v => `"${v}"`).join(";"));
      const csvContent = [headers, ...rows].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // \uFEFF is BOM for Excel UTF-8 support
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Ventas_NiezStore_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (e) {
        alert("Error al exportar a CSV: " + e.message);
    }
  };

  useEffect(() => {
    fetchOrders(1);
    
    // Clear the context so that if the user navigates away and back, it resets
    // We only want to auto-filter immediately after clicking "Ver" from the dashboard
    if (initialSearch && typeof onClearInitialSearch === 'function') {
      // Small timeout to ensure state is set before clearing parent
      setTimeout(() => onClearInitialSearch(), 500);
    }
  }, [fetchOrders, initialSearch, onClearInitialSearch]);

  const formatPrice = (v) => Number(v || 0).toFixed(2);
  const formatDate = (d) =>
    new Intl.DateTimeFormat("es-PY", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(d));

  const handleStatusDraftChange = (orderId, nextStatus) => {
    setStatusDrafts((current) => ({ ...current, [orderId]: nextStatus }));
    setStatusMessage("");
    setStatusMessageTone("info");
  };

  const handleSaveOrderStatus = async (orderId, currentStatus) => {
    if (!orderId) return;

    const normalizedCurrent = normalizeOrderStatus(currentStatus);
    const nextStatus = statusDrafts[orderId] || normalizedCurrent;
    if (!nextStatus || nextStatus === normalizedCurrent) {
      return;
    }

    setUpdatingOrderId(orderId);
    setStatusMessage("");
    setStatusMessageTone("info");

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data?.allowedTransitions?.length) {
          const nextAllowed = data.allowedTransitions
            .map((statusCode) => getStatusLabel(statusCode))
            .join(", ");
          setStatusMessage(
            `${data.error || "Transicion no permitida."} Permitidos: ${nextAllowed}.`
          );
        } else {
          setStatusMessage(data.error || "No se pudo actualizar el estado.");
        }
        setStatusMessageTone("error");
        return;
      }

      const updatedStatus = normalizeOrderStatus(data.order?.status || nextStatus);

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status: updatedStatus } : order
        )
      );
      setStatusDrafts((current) => ({ ...current, [orderId]: updatedStatus }));
      setStatusMessage("Estado actualizado correctamente.");
      setStatusMessageTone("success");

      await fetchOrders(pagination.page, { silent: true });
    } catch {
      setStatusMessage("Error de red al actualizar el estado.");
      setStatusMessageTone("error");
    } finally {
      setUpdatingOrderId("");
    }
  };

  const filteredOrders = useMemo(() => orders, [orders]);

  const summary = useMemo(() => {
    const totalRevenue = filteredOrders.reduce(
      (acc, order) => acc + Number(order.totalAmount || 0),
      0
    );
    const paidOrders = filteredOrders.filter((order) => order.status === "PAID").length;
    const pendingOrders = filteredOrders.filter((order) => isPendingStatus(order.status)).length;
    const soldUnits = filteredOrders.reduce((total, order) => {
      const orderUnits = (order.items || []).reduce(
        (itemsTotal, item) => itemsTotal + Number(item.quantity || 0),
        0
      );
      return total + orderUnits;
    }, 0);

    return {
      totalRevenue,
      averageTicket: filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
      paidOrders,
      pendingOrders,
      soldUnits,
    };
  }, [filteredOrders]);

  const metricCards = [
    {
      id: "revenue",
      title: "Ingreso visible",
      value: `$${formatPrice(summary.totalRevenue)}`,
      hint: `Ticket medio: $${formatPrice(summary.averageTicket)}`,
      icon: BadgeDollarSign,
    },
    {
      id: "paid",
      title: "Ordenes pagadas",
      value: String(summary.paidOrders),
      hint: "Cobro confirmado",
      icon: CheckCircle2,
    },
    {
      id: "pending",
      title: "Ordenes pendientes",
      value: String(summary.pendingOrders),
      hint: "Seguimiento recomendado",
      icon: Clock3,
    },
    {
      id: "units",
      title: "Unidades vendidas",
      value: String(summary.soldUnits),
      hint: "Productos incluidos",
      icon: Package,
    },
  ];

  if (loading && orders.length === 0) {
    return (
      <div className="admin-empty p-8 text-center">
        <p className="text-sm text-[var(--muted)]">Cargando historial de ventas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-alert-error text-center">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-5">
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[var(--admin-accent)]/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 left-1/3 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--admin-text-soft)]">
              Panel Comercial
            </p>
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-[var(--admin-text)] md:text-2xl">
              <Receipt className="h-5 w-5 text-[var(--admin-accent)]" />
              Gestion de Ventas
            </h2>
            <p className="max-w-2xl text-sm text-[var(--admin-text-muted)]">
              Revisa pedidos recientes, monto vendido y estado de cobro en una sola vista.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchOrders(pagination.page)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-xs font-semibold text-[var(--admin-text-muted)] transition-colors hover:border-[var(--admin-border-strong)] hover:text-[var(--admin-text)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.id}
              className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-text-soft)]">
                    {card.title}
                  </p>
                  <p className="mt-2 text-2xl font-black tracking-tight text-[var(--admin-text)]">
                    {card.value}
                  </p>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--admin-text-muted)]">{card.hint}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-text-soft)]" />
            <input
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value.slice(0, INPUT_LIMITS.search))
              }
              maxLength={INPUT_LIMITS.search}
              className="admin-input !pl-10"
              placeholder="Buscar por codigo, cliente o correo..."
              aria-label="Buscar pedidos"
            />
          </label>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-text-soft)]">
              <Funnel className="h-3.5 w-3.5" />
              Filtrar
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select h-[38px] min-w-[200px] text-xs font-semibold bg-[var(--admin-surface-muted)] border-[var(--admin-border-strong)]"
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>

            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 h-[38px] text-xs font-semibold text-[var(--admin-text-muted)] transition-colors hover:border-[var(--admin-border-strong)] hover:text-[var(--admin-text)] whitespace-nowrap"
              title="Exportar a Excel (CSV)"
            >
              <Download className="h-4 w-4" /> Exportar
            </button>
          </div>
        </div>
        {statusMessage && (
          <p
            className={`mt-3 text-xs ${
              statusMessageTone === "error"
                ? "text-[var(--admin-danger)]"
                : statusMessageTone === "success"
                  ? "text-[var(--admin-success)]"
                  : "text-[var(--admin-info)]"
            }`}
          >
            {statusMessage}
          </p>
        )}
      </section>

      {orders.length === 0 ? (
        <div className="admin-empty p-12 text-center">
          <Package className="mx-auto mb-4 h-12 w-12 text-[var(--admin-text-soft)]" />
          <p className="text-sm font-semibold text-[var(--admin-text-muted)]">
            Aun no se registraron ventas.
          </p>
          <p className="mt-1 text-xs text-[var(--admin-text-soft)]">
            Cuando llegue la primera orden aparecera aqui automaticamente.
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="admin-empty p-10 text-center">
          <p className="text-sm font-semibold text-[var(--admin-text-muted)]">
            No hay resultados para los filtros seleccionados.
          </p>
          <p className="mt-1 text-xs text-[var(--admin-text-soft)]">
            Prueba con otro estado o limpia la busqueda.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredOrders.map((order) => {
            const orderItems = order.items || [];
            const visibleItems = orderItems.slice(0, 4);
            const hiddenItems = Math.max(0, orderItems.length - visibleItems.length);
            const orderUnits = orderItems.reduce(
              (total, item) => total + Number(item.quantity || 0),
              0
            );
            const isExpanded = expandedOrderId === order.id;
            const statusOptions = getAllowedStatusOptions(order.status);

            return (
              <article
                key={order.id}
                className="group rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-3 sm:p-4 transition-all duration-200 hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-surface-muted)] overflow-hidden w-full max-w-full"
              >
                <div className="flex flex-col md:flex-row items-start md:justify-between gap-4 w-full">
                  <div className="flex items-start gap-3 w-full min-w-0">
                    <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-accent)]">
                      <Receipt className="h-5 w-5" />
                    </span>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-black tracking-wide text-[var(--admin-text)] truncate">
                          ORDEN #{order.orderCode}
                        </p>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] flex-shrink-0 ${getStatusClass(order.status)}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--admin-text-soft)]">
                        Registrada: {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-[var(--admin-border)] md:border-transparent">
                    <div className="text-left md:text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--admin-text-soft)]">
                        Total
                      </p>
                      <p className="text-lg md:text-2xl font-black tracking-tight text-[var(--admin-text)]">
                        ${formatPrice(order.totalAmount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedOrderId((current) =>
                          current === order.id ? "" : order.id
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 md:px-2.5 py-1.5 md:py-1 text-xs md:text-[11px] font-semibold text-[var(--admin-text-muted)] transition-colors hover:border-[var(--admin-border-strong)] hover:text-[var(--admin-text)]"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          Ocultar detalle
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          Ver detalle
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 border-t border-[var(--admin-border)] pt-4 text-xs text-[var(--admin-text-muted)] md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
                  <div className="flex flex-col gap-1 w-full overflow-hidden">
                    <p className="flex items-center gap-2 overflow-hidden w-full">
                      <User className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-semibold text-[var(--admin-text)] truncate">
                        {order.customerName || "Cliente"}
                      </span>
                      <span className="text-[var(--admin-text-soft)] truncate">
                        {order.customerEmail || "Sin correo"}
                      </span>
                    </p>
                  </div>
                  <p className="font-semibold text-[var(--admin-text-muted)]">
                    {orderItems.length} {orderItems.length === 1 ? "item" : "items"}
                  </p>
                  <p className="font-semibold text-[var(--admin-text-muted)]">
                    {orderUnits} {orderUnits === 1 ? "unidad" : "unidades"}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {visibleItems.map((item, index) => (
                    <span
                      key={`${item.id || item.productId || "item"}-${index}`}
                      className="inline-flex items-center rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2.5 py-1 text-[10px] font-medium text-[var(--admin-text-muted)] max-w-full overflow-hidden"
                      title={item.product?.name}
                    >
                      <span className="flex-shrink-0 mr-1">{item.quantity}x</span>
                      <span className="truncate">{item.product?.name || "Producto"}</span>
                    </span>
                  ))}
                  {hiddenItems > 0 && (
                    <span className="rounded-full border border-dashed border-[var(--admin-border-strong)] px-2.5 py-1 text-[10px] font-semibold text-[var(--admin-text-soft)]">
                      +{hiddenItems} mas
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--admin-border)] pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-text-soft)]">
                    Cambiar estado
                  </p>
                  <select
                    value={statusDrafts[order.id] || normalizeOrderStatus(order.status)}
                    onChange={(event) =>
                      handleStatusDraftChange(order.id, event.target.value)
                    }
                    className="admin-select h-9 w-auto min-w-[190px] text-xs"
                    disabled={updatingOrderId === order.id}
                    aria-label={`Estado de la orden ${order.orderCode}`}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSaveOrderStatus(order.id, order.status)}
                    disabled={
                      updatingOrderId === order.id ||
                      (statusDrafts[order.id] || normalizeOrderStatus(order.status)) ===
                        normalizeOrderStatus(order.status)
                    }
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-xs font-semibold text-[var(--admin-text-muted)] transition-colors hover:border-[var(--admin-border-strong)] hover:text-[var(--admin-text)] disabled:pointer-events-none disabled:opacity-45"
                  >
                    {updatingOrderId === order.id ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar estado"
                    )}
                  </button>
                  {order.payments?.some((p) => p.receiptUrl) && (
                    <a
                      href={getSafeReceiptUrl(order.payments.find((p) => p.receiptUrl).receiptUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex h-9 items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 text-xs font-semibold text-cyan-400 transition-colors hover:border-cyan-500/50 hover:bg-cyan-500/20"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      Ver comprobante
                    </a>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-4 grid gap-3 border-t border-[var(--admin-border)] pt-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] overflow-hidden w-full min-w-0">
                    <section className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 overflow-hidden w-full min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-text-soft)]">
                        Productos del pedido
                      </p>
                      <div className="mt-2 space-y-2">
                        {orderItems.map((item, index) => (
                          <div
                            key={`${item.id || item.productId || "detail"}-${index}`}
                            className="grid gap-1 rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-2 text-xs sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center overflow-hidden w-full min-w-0"
                          >
                            <p className="font-semibold text-[var(--admin-text)] overflow-hidden text-ellipsis whitespace-nowrap pr-2" title={item.product?.name}>
                              {item.product?.name || "Producto"}
                            </p>
                            <p className="text-[var(--admin-text-muted)]">
                              Cant: {Number(item.quantity || 0)}
                            </p>
                            <p className="text-[var(--admin-text-muted)]">
                              Unit: ${formatPrice(item.unitPrice)}
                            </p>
                            <p className="font-semibold text-[var(--admin-text)]">
                              Subtotal: ${formatPrice(item.lineTotal)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-3 overflow-hidden w-full min-w-0">
                      <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 overflow-hidden w-full min-w-0">
                        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-text-soft)]">
                          <Truck className="h-3.5 w-3.5" />
                          Envio
                        </p>
                        <div className="mt-2 space-y-1 text-xs text-[var(--admin-text-muted)]">
                          <p className="font-semibold text-[var(--admin-text)] break-all line-clamp-2" title={order.shippingLine1}>
                            {order.shippingLine1 || "Sin direccion"}
                          </p>
                          {order.shippingLine2 ? <p className="break-all line-clamp-2" title={order.shippingLine2}>{order.shippingLine2}</p> : null}
                          <p className="flex items-start gap-1.5 w-full overflow-hidden">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                            <span className="break-all">
                              {[
                                order.shippingCity,
                                order.shippingRegion,
                                order.shippingPostal,
                                order.shippingCountry,
                              ]
                                .filter(Boolean)
                                .join(", ") || "Sin datos de ubicacion"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 overflow-hidden w-full min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-text-soft)]">
                          Contacto
                        </p>
                        <div className="mt-2 space-y-1 text-xs text-[var(--admin-text-muted)] w-full overflow-hidden">
                          <p className="flex items-center gap-1.5 w-full overflow-hidden">
                            <User className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{order.customerName || "Sin nombre"}</span>
                          </p>
                          <p className="flex items-center gap-1.5 w-full overflow-hidden">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{order.customerEmail || "Sin correo"}</span>
                          </p>
                          <p className="flex items-center gap-1.5 w-full overflow-hidden">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{order.customerPhone || "Sin telefono"}</span>
                          </p>
                        </div>
                      </div>

                      {order.notes ? (
                        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 overflow-hidden w-full min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-text-soft)]">
                            Nota del cliente
                          </p>
                          <p className="mt-2 text-xs text-[var(--admin-text-muted)]">
                            {order.notes}
                          </p>
                        </div>
                      ) : null}

                      {order.auditLogs && order.auditLogs.length > 0 && (
                        <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3 overflow-hidden w-full min-w-0">
                          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-text-soft)]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Historial de Auditoria
                          </p>
                          <div className="mt-3 space-y-3 relative before:absolute before:inset-y-0 before:left-1.5 before:w-px before:bg-[var(--admin-border)]">
                            {order.auditLogs.map((log) => (
                              <div key={log.id} className="relative pl-5 text-xs">
                                <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-[var(--admin-surface)] bg-[var(--admin-accent)]"></span>
                                <p className="font-semibold text-[var(--admin-text)]">
                                  {log.details || log.action}
                                </p>
                                <p className="text-[var(--admin-text-muted)] mt-0.5">
                                  por {log.admin?.fullName || "Administrador"} • {formatDate(log.createdAt)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages || 1}
        totalItems={pagination.totalAll || pagination.total || orders.length}
        pageSize={pagination.pageSize || 10}
        onPageChange={fetchOrders}
        className="mt-6"
      />
    </div>
  );
}
