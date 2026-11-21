import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ecommerce/ProductCard";
import {
  getCategoryBrands,
  getCategoryBySlug,
  getProductsByCategorySlug,
} from "@/lib/catalog";
import PageShell from "@/components/ui/page-shell";
import PageHeader from "@/components/ui/page-header";
import SearchFilters from "@/components/ecommerce/SearchFilters";
import SearchPagination from "@/components/ui/search-pagination";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const category = await getCategoryBySlug(resolvedParams?.slug);
  if (!category) {
    return { title: "Categoría no encontrada | Niez Store" };
  }
  return {
    title: `${category.name} | Niez Store`,
    description:
      category.description ||
      `Explora nuestra selección de ${category.name.toLowerCase()} en Niez Store.`,
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const slug = resolvedParams?.slug;
  const page = Math.max(1, Number.parseInt(String(resolvedSearchParams?.page ?? "1"), 10) || 1);
  const minPrice = resolvedSearchParams?.minPrice;
  const maxPrice = resolvedSearchParams?.maxPrice;
  const brand = typeof resolvedSearchParams?.brand === "string" ? resolvedSearchParams.brand.trim() : undefined;
  const sort = typeof resolvedSearchParams?.sort === "string" ? resolvedSearchParams.sort : undefined;
  const onSale = resolvedSearchParams?.onSale === "true";

  const [{ category, products, totalItems, totalPages }, brands] = await Promise.all([
    getProductsByCategorySlug(slug, {
      page,
      pageSize: 20,
      minPrice,
      maxPrice,
      brand,
      sort,
      onSale,
    }),
    getCategoryBrands(slug),
  ]);

  if (!category) {
    return notFound();
  }

  return (
    <PageShell>
      {/* Breadcrumbs */}
      <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
        <Link href="/" className="hover:text-cyan-500 transition">Inicio</Link>
        <span>/</span>
        <Link href="/categorias" className="hover:text-cyan-500 transition">Categorías</Link>
        <span>/</span>
        <span className="text-cyan-500">{category.name}</span>
      </div>

      <PageHeader
        title={category.name}
        description={category.description || `Explora nuestra selección de ${category.name.toLowerCase()}.`}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Filters Sidebar - Reusing SearchFilters */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <Suspense fallback={null}>
            <SearchFilters brands={brands} />
          </Suspense>
        </div>

        {/* Results Area */}
        <div className="flex flex-col gap-8">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/20 py-16 px-6 text-center">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                No hay productos
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                No se encontraron productos en esta categoría con los filtros aplicados.
              </p>
              <Link
                href={`/categoria/${slug}`}
                className="mt-6 rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-bold text-[#000] transition hover:bg-cyan-300"
              >
                Limpiar filtros
              </Link>
            </div>
          ) : (
            <>
              {/* Product Grid - Exactly matches Landing Page */}
              <div className="grid shop-card-grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} variant="rail" />
                ))}
              </div>

              {/* Pagination Area */}
              <div className="mt-4 flex justify-center border-t border-[var(--border)] py-8">
                <Suspense fallback={null}>
                  <SearchPagination
                    page={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={20}
                  />
                </Suspense>
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
