"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { X, ChevronDown, Filter } from "lucide-react";

export default function SearchFilters({ brands = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      // Reset page when filtering
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  const applyFilters = () => {
    let currentParams = new URLSearchParams(searchParams.toString());
    
    if (minPrice) currentParams.set("minPrice", minPrice);
    else currentParams.delete("minPrice");
    
    if (maxPrice) currentParams.set("maxPrice", maxPrice);
    else currentParams.delete("maxPrice");
    
    if (selectedBrand) currentParams.set("brand", selectedBrand);
    else currentParams.delete("brand");

    currentParams.delete("page");
    router.push(`/buscar?${currentParams.toString()}`);
    setIsMobileOpen(false);
  };

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedBrand("");
    router.push(`/buscar?q=${searchParams.get("q") || ""}`);
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
                      checked={selectedBrand === brand}
                      onChange={() => setSelectedBrand(brand)}
                      className="h-4 w-4 rounded border-[var(--border)] text-cyan-500 focus:ring-cyan-500 bg-[var(--surface-soft)]"
                    />
                    <span className={`text-sm ${selectedBrand === brand ? "font-bold text-cyan-500" : "text-[var(--foreground)]"}`}>
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
              onClick={applyFilters}
              className="w-full rounded-xl bg-cyan-400 py-3 text-sm font-bold text-[#000] transition hover:bg-cyan-300"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={clearFilters}
              className="w-full text-sm font-medium text-[var(--muted)] underline underline-offset-4 hover:text-[var(--foreground)]"
            >
              Limpiar todo
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
