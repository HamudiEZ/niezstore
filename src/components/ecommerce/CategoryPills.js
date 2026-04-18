import {
  Bike,
  Cpu,
  Dumbbell,
  Home,
  Laptop,
  Monitor,
  ShoppingBasket,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const categoryIcons = {
  electronica: Monitor,
  computadoras: Laptop,
  "componentes-pc": Cpu,
  hogar: Home,
  moda: Sparkles,
  deportes: Dumbbell,
  supermercado: ShoppingBasket,
  motos: Bike,
};

export default function CategoryPills({ categories }) {
  return (
    <section className="soft-card overflow-hidden p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="section-title text-slate-100">Categorias populares</h2>
        <Link
          href="/categorias"
          className="shrink-0 text-xs font-semibold text-cyan-300 hover:underline"
        >
          Ver todas
        </Link>
      </div>

      <div className="grid grid-cols-2 shop-card-grid sm:grid-cols-4 xl:grid-cols-8">
        {categories.map((category) => {
          const iconKey = category.slug || category.id;
          const Icon = categoryIcons[iconKey] || Monitor;

          return (
            <Link
              key={category.id}
              href={`/categoria/${category.slug ?? category.id}`}
              className="group rounded-xl border border-slate-700 bg-slate-900/70 p-3 transition hover:-translate-y-0.5 hover:border-cyan-400/70 hover:bg-slate-900"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-cyan-300 shadow-sm">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-2 text-sm font-semibold text-slate-100">
                {category.name}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                {category.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
