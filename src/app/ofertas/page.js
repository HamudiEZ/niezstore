import ProductCard from "../../components/ecommerce/ProductCard";
import { getOfferProducts } from "../../lib/catalog";

export default async function OffersPage() {
  const offers = await getOfferProducts(8);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
        Ofertas del dia
      </h1>
      <section className="soft-card p-4 md:p-5">
        <div className="grid shop-card-grid sm:grid-cols-2 lg:grid-cols-4">
          {offers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
