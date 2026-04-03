"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { X, ChevronDown, Filter } from "lucide-react";

export default function SearchFilters({ brands = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Sync state if URL changes from outside (e.g., clear all)
  useEffect(() => {
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
  }, [searchParams]);

  const updateUrl = useCallback((changes) => {
    const current = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([k, v]) => {
      if (v === "" || v === false || v === null || v === undefined) {
        current.delete(k);
      } else {
        current.set(k, v);
      }
    });
    current.delete("page");
    router.push(`${pathname}?${current.toString()}`);
  }, [searchParams, pathname, router]);

  // Debounce prices
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentMin = searchParams.get("minPrice") || "";
      const currentMax = searchParams.get("maxPrice") || "";
      if (minPrice !== currentMin || maxPrice !== currentMax) {
        updateUrl({ minPrice, maxPrice });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [minPrice, maxPrice, searchParams, updateUrl]);

  const clearFilters = () => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 lg:hidden"
      >
        <Filter className="h-4 w-4" />
        Filtros
      </button>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-0 z-[60] flex flex-col bg-[var(--background)] p-6 transition-transform duration-300
        lg:relative lg:inset-auto lg:z-0 lg:flex lg:translate-x-0 lg:rounded-2xl lg:border lg:border-[var(--border)] lg:bg-[var(--surface)] lg:p-6 lg:dark:border-[var(--border)] lg:dark:bg-[var(--surface-soft)]/30
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex items-center justify-between lg:hidden">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Filtros</h2>
          <button onClick={() => setIsMobileOpen(false)} className="p-2">
            <X className="h-6 w-6 text-[var(--muted)]" />
          </button>
        </div>

        <div className="mt-8 space-y-8 lg:mt-0">
          {/* Price Range */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Rango de Precio
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400"
              />
              <span className="text-[var(--muted)]"> - </span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Ordenar por
            </h3>
            <select
              value={searchParams.get("sort") || ""}
              onChange={(e) => updateUrl({ sort: e.target.value })}
              className="w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-cyan-400"
            >
              <option value="">Más relevantes</option>
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="name_asc">Nombre A-Z</option>
              <option value="name_desc">Nombre Z-A</option>
            </select>
          </div>

          {/* Offers */}
          <div>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={searchParams.get("onSale") === "true"}
                onChange={(e) => updateUrl({ onSale: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--border)] text-cyan-500 focus:ring-cyan-500 bg-[var(--surface-soft)]"
              />
              <span className="text-sm font-semibold text-[var(--foreground)]">
                Solo ofertas y descuentos
              </span>
            </label>
          </div>

          {/* Brands */}
          {brands.length > 0 && (
            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Marca
              </h3>
              <div className="space-y-2">
                {brands.map((brand) => (
                  <label key={brand} className="flex cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="brand"
                      checked={searchParams.get("brand") === brand}
                      onChange={() => updateUrl({ brand })}
                      className="h-4 w-4 rounded border-[var(--border)] text-cyan-500 focus:ring-cyan-500 bg-[var(--surface-soft)]"
                    />
                    <span className={`text-sm ${searchParams.get("brand") === brand ? "font-bold text-cyan-500" : "text-[var(--foreground)]"}`}>
                      {brand}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-4">
            <button
              onClick={clearFilters}
              className="w-full text-sm font-medium text-[var(--muted)] underline underline-offset-4 hover:text-[var(--foreground)]"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
