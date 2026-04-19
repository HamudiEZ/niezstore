/**
 * Fuente de verdad centralizada para estados de orden.
 * Usado tanto por el API server (orders/[id]/route.js) como por el cliente (OrdersManager.js).
 */

export const ORDER_STATUS_OPTIONS = [
  { value: "PENDING_PAYMENT", label: "Pendiente de pago" },
  { value: "PAID", label: "Pagado" },
  { value: "PROCESSING", label: "En proceso" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "CANCELLED", label: "Cancelado" },
];

export const STATUS_LABELS = {
  PAID: "Pagado",
  PENDING: "Pendiente",
  PENDING_PAYMENT: "Pendiente de pago",
  PROCESSING: "En proceso",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const STATUS_TRANSITIONS = {
  PENDING_PAYMENT: ["PENDING_PAYMENT", "PAID", "CANCELLED"],
  PAID: ["PAID", "PROCESSING", "CANCELLED"],
  PROCESSING: ["PROCESSING", "SHIPPED", "CANCELLED"],
  SHIPPED: ["SHIPPED", "DELIVERED"],
  DELIVERED: ["DELIVERED"],
  CANCELLED: ["CANCELLED"],
};

export const ALLOWED_STATUSES = new Set(ORDER_STATUS_OPTIONS.map((o) => o.value));

export function normalizeOrderStatus(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "PENDING") return "PENDING_PAYMENT";
  return normalized;
}

export function isPendingStatus(status) {
  return status === "PENDING_PAYMENT" || status === "PENDING";
}

export function getStatusLabel(status) {
  if (!status) return "Sin estado";
  return STATUS_LABELS[status] || status;
}

export function getAllowedStatusOptions(currentStatus) {
  const normalizedStatus = normalizeOrderStatus(currentStatus);
  const allowedStatuses = STATUS_TRANSITIONS[normalizedStatus] || [normalizedStatus];
  return ORDER_STATUS_OPTIONS.filter((option) => allowedStatuses.includes(option.value));
}
