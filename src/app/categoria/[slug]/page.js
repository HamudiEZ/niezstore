import { notFound } from "next/navigation";
import ProductCard from "../../../components/ecommerce/ProductCard";
import { getCategoryById, getProductsByCategory } from "../../../lib/dummy-data";

export default function CategoryPage({ params }) {
  const category = getCategoryById(params.slug);

  if (!category) {
    return notFound();
  }

  const categoryProducts = getProductsByCategory(category.id);

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-500">Inicio / Categoria / {category.name}</div>

      <header className="soft-card p-4 md:p-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">{category.name}</h1>
        <p className="mt-1 text-sm text-slate-400">{category.description}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="soft-card h-fit p-4 text-sm">
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
            <p className="text-[11px] text-slate-500">UI de filtros, aun sin backend.</p>
          </div>
        </aside>

        <section className="soft-card p-4 md:p-5">
          {categoryProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
              No hay productos en esta categoria todavia.
            </div>
          ) : (
            <div className="grid shop-card-grid sm:grid-cols-2 xl:grid-cols-3">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
