"use client";

import { useEffect, useState } from "react";
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

  // Only refresh global stats if they switch tabs to keep them reasonably up to date
  useEffect(() => {
    let active = true;
    fetchJson("/api/admin/stats")
      .then((data) => {
        if (active && data.stats) {
          setGlobalStats(data.stats);
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => { active = false };
  }, [activeSection]); // Re-fetch lightweight stats on tab change

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
          onNavigateToOrders={(code) => {
            if (typeof code === 'string' && code !== 'orders') {
              setOrderSearchContext(code);
            } else {
              setOrderSearchContext("");
            }
            setActiveSection("orders");
          }} 
          onNavigateToProduct={(productId) => {
             setExternalProductId(productId);
             setActiveSection("products");
          }}
        />
      )}
      
      {activeSection === "categories" && (
        <CategoriesManager onGoToProducts={() => setActiveSection("products")} />
      )}
      
      {activeSection === "orders" && (
        <OrdersManager 
          initialSearch={orderSearchContext} 
          onClearInitialSearch={() => setOrderSearchContext("")} 
        />
      )}

      {activeSection === "products" && (
        <ProductsManager 
           externalProductId={externalProductId} 
           onClearExternalProductId={() => setExternalProductId(null)} 
        />
      )}
    </AdminLayout>
  );
}
