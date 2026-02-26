import Link from "next/link";
import HeroBanner from "../components/ecommerce/HeroBanner";
import CategoryPills from "../components/ecommerce/CategoryPills";
import ProductCard from "../components/ecommerce/ProductCard";
import { categories, heroDeals, offerBanners, products } from "../lib/dummy-data";

export default function Home() {
  const featuredProducts = products.slice(0, 8);

  return (
    <div className="space-y-6 pb-8">
      <div className="full-bleed">
        <HeroBanner deals={heroDeals} />
      </div>

      <div className="space-y-6 px-4 md:px-8 lg:px-10">
        <section className="grid gap-3 sm:grid-cols-3">
          <article className="soft-card p-4 text-sm">
            <p className="font-semibold text-slate-100">Envio confiable</p>
            <p className="mt-1 text-slate-400">Cobertura en todo el pais y seguimiento en tiempo real.</p>
          </article>
          <article className="soft-card p-4 text-sm">
            <p className="font-semibold text-slate-100">Pagos seguros</p>
            <p className="mt-1 text-slate-400">Tarjeta, transferencia y efectivo en puntos autorizados.</p>
          </article>
          <article className="soft-card p-4 text-sm">
            <p className="font-semibold text-slate-100">Soporte 24/7</p>
            <p className="mt-1 text-slate-400">Te ayudamos antes, durante y despues de cada compra.</p>
          </article>
        </section>

        <CategoryPills categories={categories} />

        <section className="soft-card p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="section-title text-slate-100">Productos destacados</h2>
            <Link href="/ofertas" className="text-xs font-semibold text-cyan-300 hover:underline">
              Ver todas las ofertas
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {offerBanners.map((banner) => (
            <article
              key={banner.id}
              className={`rounded-2xl bg-gradient-to-r ${banner.color} p-4 text-white shadow-lg`}
            >
              <p className="text-xs font-medium text-white/80">Promocion</p>
              <p className="mt-2 text-lg font-extrabold leading-tight">{banner.title}</p>
              <p className="mt-1 text-sm text-white/90">{banner.subtitle}</p>
              <Link href="/ofertas" className="mt-4 inline-flex rounded-lg bg-black/25 px-3 py-2 text-xs font-semibold backdrop-blur hover:bg-black/35">
                Ver promo
              </Link>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
