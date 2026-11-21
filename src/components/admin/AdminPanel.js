"use client";

import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import CategoriesManager from "./CategoriesManager";
import ProductsManager from "./ProductsManager";
import OrdersManager from "./OrdersManager";
import DashboardTab from "./DashboardTab";
import { fetchJson } from "@/lib/admin-fetch";

const ADMIN_SECTIONS = [
  {
    id: "dashboard",
    title: "Resumen",
    description: "Métricas y KPIs en tiempo real del negocio.",
  },
  {
    id: "categories",
    title: "Categorias",
    description: "Alta, edicion y limpieza de categorias del catalogo.",
  },
  {
    id: "products",
    title: "Productos",
    description: "Creacion, filtros, opciones y variantes de productos.",
  },
  {
    id: "orders",
    title: "Ventas",
    description: "Monitoreo de pedidos, ingresos y datos de clientes.",
  },
];

const DEFAULT_STATS = {
  totalProducts: 0,
  totalVariants: 0,
  lowStockCount: 0,
  totalCategories: 0,
};

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [orderSearchContext, setOrderSearchContext] = useState("");
  const [externalProductId, setExternalProductId] = useState(null);

  const [globalStats, setGlobalStats] = useState(DEFAULT_STATS);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchJson("/api/admin/stats")
      .then((data) => {
        if (active && data.stats) {
          setGlobalStats(data.stats);
          setError("");
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [activeSection]);

  const handleNavigateToOrders = useCallback((code) => {
    if (typeof code === "string" && code !== "orders") {
      setOrderSearchContext(code);
    } else {
      setOrderSearchContext("");
    }
    setActiveSection("orders");
  }, []);

  const handleNavigateToProduct = useCallback((productId) => {
    setExternalProductId(productId);
    setActiveSection("products");
  }, []);

  const handleClearOrderSearch = useCallback(() => {
    setOrderSearchContext("");
  }, []);

  const handleClearExternalProductId = useCallback(() => {
    setExternalProductId(null);
  }, []);

  const handleGoToProducts = useCallback(() => {
    setActiveSection("products");
  }, []);

  return (
    <AdminLayout
      stats={globalStats}
      error={error}
      tabs={ADMIN_SECTIONS}
      activeTab={activeSection}
      onTabChange={setActiveSection}
    >
      {activeSection === "dashboard" && (
        <DashboardTab
          onNavigateToOrders={handleNavigateToOrders}
          onNavigateToProduct={handleNavigateToProduct}
        />
      )}

      {activeSection === "categories" && (
        <CategoriesManager onGoToProducts={handleGoToProducts} />
      )}

      {activeSection === "orders" && (
        <OrdersManager
          initialSearch={orderSearchContext}
          onClearInitialSearch={handleClearOrderSearch}
        />
      )}

      {activeSection === "products" && (
        <ProductsManager
          externalProductId={externalProductId}
          onClearExternalProductId={handleClearExternalProductId}
        />
      )}
    </AdminLayout>
  );
}
