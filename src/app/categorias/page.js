import Link from "next/link";
import { getPublicCategories } from "../../lib/catalog";
import PageShell from "../../components/ui/page-shell";
import PageHeader from "../../components/ui/page-header";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Categorías | Niez Store",
  description: "Explora todo el catálogo de Niez Store por categoría.",
};

export default async function CategoriesPage() {
  const categories = await getPublicCategories();

  return (
    <PageShell>
      <PageHeader
        title="Todas las categorías"
        description="Explora cada sección del catálogo y entra al listado de productos."
      />
      <div className="mt-8 grid shop-card-grid sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categoria/${category.slug}`}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-cyan-400/70 hover:bg-[var(--surface-soft)] hover:-translate-y-0.5 hover:shadow-lg"
          >
            <p className="font-semibold text-[var(--foreground)]">{category.name}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {category.description}
            </p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
