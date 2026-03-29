import Link from "next/link";
import { getPublicCategories } from "../../lib/catalog";
import PageShell from "../../components/ui/page-shell";
import PageHeader from "../../components/ui/page-header";
import SectionCard from "../../components/ui/section-card";

export default async function CategoriesPage() {
  const categories = await getPublicCategories();

  return (
    <PageShell>
      <PageHeader
        title="Todas las categorias"
        description="Explora cada seccion del catalogo y entra al listado de productos."
      />
      <SectionCard>
        <div className="grid shop-card-grid sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categoria/${category.slug}`}
              className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 transition hover:border-cyan-400/70 hover:bg-slate-900"
            >
              <p className="font-semibold text-slate-100">{category.name}</p>
              <p className="mt-1 text-sm text-slate-400">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
}
