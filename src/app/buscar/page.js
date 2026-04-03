import { searchProducts, getSearchBrands } from "@/lib/catalog";
import ProductCard from "@/components/ecommerce/ProductCard";
import PageShell from "@/components/ui/page-shell";
import PageHeader from "@/components/ui/page-header";
import SectionCard from "@/components/ui/section-card";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import SearchFilters from "@/components/ecommerce/SearchFilters";
import SearchPagination from "@/components/ui/search-pagination";

export default async function SearchPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const q = String(resolvedSearchParams?.q ?? "").trim();
  const page = Number(resolvedSearchParams?.page ?? 1);
  const minPrice = resolvedSearchParams?.minPrice;
  const maxPrice = resolvedSearchParams?.maxPrice;
  const brand = resolvedSearchParams?.brand;

  const [{ products, totalItems, totalPages }, brands] = await Promise.all([
    searchProducts(q, { 
      page, 
      pageSize: 20, 
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      brand 
    }),
    getSearchBrands(q)
  ]);

  return (
    <PageShell>
      {/* Breadcrumbs */}
      <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
        <Link href="/" className="hover:text-cyan-500 transition">Inicio</Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">Búsqueda</span>
        {q && (
          <>
            <span>/</span>
            <span className="text-cyan-500">"{q}"</span>
          </>
        )}
      </div>

      <PageHeader 
        title={q ? `Resultados para "${q}"` : "Búsqueda de productos"} 
        description={totalItems > 0 
          ? `Encontramos ${totalItems} productos que coinciden con tu búsqueda.` 
          : q ? "No se encontraron resultados para tu búsqueda." : "Ingresa un término para empezar."
        } 
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Filters Sidebar */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <SearchFilters brands={brands} />
        </div>

        {/* Results Area */}
        <div className="flex flex-col gap-8">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/20 py-16 px-6 text-center">
              <div className="mb-4 rounded-full bg-[var(--surface-soft)] p-4">
                <Search className="h-6 w-6 text-[var(--muted)]" />
              </div>
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                No hay coincidencias
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Intenta ajustar los filtros o buscar algo menos específico.
              </p>
              <Link 
                href="/buscar?q=" 
                className="mt-6 rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-bold text-[#000] transition hover:bg-cyan-300"
              >
                Limpiar búsqueda
              </Link>
            </div>
          ) : (
            <>
              {/* Product Grid - Exactly matches Landing Page */}
              <div className="grid shop-card-grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} variant="rail" />
                ))}
              </div>

              {/* Pagination Area */}
              <div className="mt-4 flex justify-center border-t border-[var(--border)] py-8">
                <SearchPagination 
                  page={page} 
                  totalPages={totalPages} 
                  totalItems={totalItems} 
                  pageSize={20} 
                />
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
