import Image from "next/image";
import { notFound } from "next/navigation";
import ProductCard from "../../../components/ecommerce/ProductCard";
import { Button } from "../../../components/ui/button";
import { getCategoryById, getProductById, products } from "../../../lib/dummy-data";

export default function ProductPage({ params }) {
  const product = getProductById(params.id);

  if (!product) {
    return notFound();
  }

  const category = getCategoryById(product.categoryId);
  const relatedProducts = products
    .filter((item) => item.categoryId === product.categoryId && item.id !== product.id)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="text-xs text-slate-500">
        Inicio / {category ? category.name : "Categoria"} / {product.name}
      </div>

      <section className="soft-card p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl bg-slate-900/70 p-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-950">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 550px"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{product.brand}</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-100">{product.name}</h1>
            <p className="mt-3 text-sm text-slate-400">{product.description}</p>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-100">
                ${product.price.toFixed(2)}
              </span>
              {product.previousPrice ? (
                <span className="pb-1 text-sm text-slate-500 line-through">
                  ${product.previousPrice.toFixed(2)}
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                Envio gratis
              </span>
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300">
                Garantia 12 meses
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button size="lg">Agregar al carrito</Button>
              <Button size="lg" variant="outline">
                Comprar ahora
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="soft-card p-4 md:p-5">
        <h2 className="section-title text-slate-100">Tambien te puede interesar</h2>
        <div className="mt-4 grid shop-card-grid sm:grid-cols-2 lg:grid-cols-4">
          {relatedProducts.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
