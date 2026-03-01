import ProductCard from "../../components/ecommerce/ProductCard";
import { products } from "../../lib/dummy-data";

export default function FavoritesPage() {
  const favorites = products.slice(2, 6);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Favoritos</h1>
      <p className="text-sm text-slate-400">Listado de ejemplo en frontend, sin persistencia todavia.</p>
      <section className="soft-card p-4 md:p-5">
        <div className="grid shop-card-grid sm:grid-cols-2 lg:grid-cols-4">
          {favorites.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
