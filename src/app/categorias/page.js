import Link from "next/link";
import { categories } from "../../lib/dummy-data";

export default function CategoriesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Todas las categorias</h1>
      <section className="soft-card p-4 md:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/categoria/${category.id}`} className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 transition hover:border-cyan-400/70 hover:bg-slate-900">
              <p className="font-semibold text-slate-100">{category.name}</p>
              <p className="mt-1 text-sm text-slate-400">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
