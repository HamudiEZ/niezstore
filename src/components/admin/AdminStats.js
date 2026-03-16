import { Boxes, Layers, Package, Tags } from "lucide-react";

export default function AdminStats({ stats }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article className="soft-card p-4">
        <p className="text-xs text-slate-400">Productos</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-100">
          {stats.totalProducts}
        </p>
        <div className="mt-3 inline-flex rounded-lg bg-cyan-500/20 p-2 text-cyan-300">
          <Boxes className="h-4 w-4" />
        </div>
      </article>
      <article className="soft-card p-4">
        <p className="text-xs text-slate-400">Variantes</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-100">
          {stats.totalVariants}
        </p>
        <div className="mt-3 inline-flex rounded-lg bg-emerald-500/20 p-2 text-emerald-300">
          <Layers className="h-4 w-4" />
        </div>
      </article>
      <article className="soft-card p-4">
        <p className="text-xs text-slate-400">Stock bajo</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-100">
          {stats.lowStockCount}
        </p>
        <div className="mt-3 inline-flex rounded-lg bg-amber-500/20 p-2 text-amber-300">
          <Package className="h-4 w-4" />
        </div>
      </article>
      <article className="soft-card p-4">
        <p className="text-xs text-slate-400">Categorias</p>
        <p className="mt-1 text-2xl font-extrabold text-slate-100">
          {stats.totalCategories}
        </p>
        <div className="mt-3 inline-flex rounded-lg bg-sky-500/20 p-2 text-sky-300">
          <Tags className="h-4 w-4" />
        </div>
      </article>
    </section>
  );
}
