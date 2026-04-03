import Link from "next/link";
import ProductCard from "../../components/ecommerce/ProductCard";
import { getOfferProducts } from "../../lib/catalog";
import PageShell from "../../components/ui/page-shell";
import PageHeader from "../../components/ui/page-header";

export const metadata = {
  title: "Ofertas del día | Niez Store",
  description: "Productos seleccionados con precio promocional y disponibilidad activa.",
};

export default async function OffersPage() {
  const offers = await getOfferProducts(40);

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
        description={`${offers.length} productos seleccionados con precio promocional y disponibilidad activa.`}
      />

      <div className="mt-8">
        {offers.length === 0 ? (
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
          <div className="grid shop-card-grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {offers.map((product) => (
              <ProductCard key={product.id} product={product} variant="rail" />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
