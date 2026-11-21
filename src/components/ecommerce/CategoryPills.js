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
    <section className="soft-card overflow-hidden p-4 md:p-5 border border-[var(--border)] bg-[var(--surface)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="section-title text-[var(--foreground)]">Categorías populares</h2>
        <Link
          href="/categorias"
          className="shrink-0 text-xs font-semibold text-[var(--accent)] hover:underline"
        >
          Ver todas
        </Link>
      </div>

      <div className="grid grid-cols-2 shop-card-grid sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {categories.map((category) => {
          const iconKey = category.slug || category.id;
          const Icon = categoryIcons[iconKey] || Monitor;

          return (
            <Link
              key={category.id}
              href={`/categoria/${category.slug ?? category.id}`}
              className="group rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/50 p-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent)] hover:bg-[var(--surface-soft)] hover:shadow-md"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--accent)] shadow-sm border border-[var(--border)]/60 group-hover:scale-105 transition-transform">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-2.5 text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                {category.name}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                {category.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
