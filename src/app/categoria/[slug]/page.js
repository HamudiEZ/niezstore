import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "../../../components/ecommerce/ProductCard";
import { getProductsByCategorySlug } from "../../../lib/catalog";
import PageShell from "../../../components/ui/page-shell";
import PageHeader from "../../../components/ui/page-header";
import SectionCard from "../../../components/ui/section-card";

export default async function CategoryPage({ params }) {
  const resolvedParams = await params;
  const { category, products } = await getProductsByCategorySlug(
    resolvedParams?.slug
  );

  if (!category) {
    return notFound();
  }

  return (
    <PageShell>
      <div className="text-xs text-slate-500">Inicio / Categoria / {category.name}</div>

      <PageHeader title={category.name} description={category.description || "Sin descripcion"} />

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <SectionCard as="aside" className="h-fit p-4 text-sm">
          <p className="font-semibold text-slate-100">Filtros</p>
          <div className="mt-3 space-y-3 text-xs text-slate-400">
            <div>
              <p className="font-semibold text-slate-300">Rango de precio</p>
              <p>$10 - $2000</p>
            </div>
            <div>
              <p className="font-semibold text-slate-300">Marca</p>
              <p>Samsung, Apple, NVIDIA, Nike</p>
            </div>
            <div>
              <p className="font-semibold text-slate-300">Ordenar por</p>
              <p>Relevancia, Menor precio, Mayor precio</p>
            </div>
            <p className="text-[11px] text-slate-500">
              UI de filtros, aun sin backend.
            </p>
          </div>
        </SectionCard>

        <SectionCard>
          {products.length === 0 ? (
            <div className="notice-muted flex flex-wrap items-center justify-center gap-2 text-center text-sm">
              <span>No hay productos en esta categoria todavia.</span>
              <Link href="/" className="accent-link font-semibold">
                Volver al inicio
              </Link>
            </div>
          ) : (
            <div className="grid shop-card-grid sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
