import Link from "next/link";
import ProductCard from "../../components/ecommerce/ProductCard";
import { getOfferProducts } from "../../lib/catalog";
import PageShell from "../../components/ui/page-shell";
import PageHeader from "../../components/ui/page-header";

import SearchPagination from "../../components/ui/search-pagination";

export const metadata = {
  title: "Ofertas del día | Niez Store",
  description: "Productos seleccionados con precio promocional y disponibilidad activa.",
};

export default async function OffersPage(props) {
  const resolvedParams = await props.searchParams;
  const page = parseInt(resolvedParams?.page || "1", 10);
  const pageSize = 6;

  const offers = await getOfferProducts(100);
  const paginatedOffers = offers.slice((page - 1) * pageSize, page * pageSize);
  const totalItems = offers.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <PageShell>
      {/* Breadcrumbs */}
      <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
        <Link href="/" className="hover:text-cyan-500 transition">Inicio</Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">Ofertas</span>
      </div>

      <PageHeader
        title="Ofertas del día"
        description={`${totalItems} productos seleccionados con precio promocional y disponibilidad activa.`}
      />

      <div className="mt-8">
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/20 py-16 px-6 text-center">
            <h2 className="text-lg font-bold text-[var(--foreground)]">Sin ofertas por ahora</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Revisá más tarde, actualizamos las promociones constantemente.</p>
            <Link
              href="/categorias"
              className="mt-6 rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-bold text-[#000] transition hover:bg-cyan-300"
            >
              Ver catálogo completo
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4 w-full">
              {paginatedOffers.map((product) => (
                <ProductCard key={product.id} product={product} variant="list" />
              ))}
            </div>

            {totalItems > pageSize && (
              <div className="mt-4 flex justify-center border-t border-[var(--border)] py-8">
                <SearchPagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
