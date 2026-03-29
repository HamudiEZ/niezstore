import ProductCard from "../../components/ecommerce/ProductCard";
import { getOfferProducts } from "../../lib/catalog";
import PageShell from "../../components/ui/page-shell";
import PageHeader from "../../components/ui/page-header";
import SectionCard from "../../components/ui/section-card";

export default async function OffersPage() {
  const offers = await getOfferProducts(8);

  return (
    <PageShell>
      <PageHeader
        title="Ofertas del dia"
        description="Productos seleccionados con precio promocional y disponibilidad activa."
      />
      <SectionCard>
        <div className="grid shop-card-grid sm:grid-cols-2 lg:grid-cols-4">
          {offers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
}
