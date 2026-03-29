import { Boxes, Layers, Package, Tags } from "lucide-react";

export default function AdminStats({ stats }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article className="soft-card p-4">
        <p className="text-xs admin-subtitle">Productos</p>
        <p className="mt-1 text-2xl font-extrabold admin-title">
          {stats.totalProducts}
        </p>
        <div className="admin-accent mt-3 inline-flex rounded-lg border admin-border p-2 admin-surface-soft">
          <Boxes className="h-4 w-4" />
        </div>
      </article>
      <article className="soft-card p-4">
        <p className="text-xs admin-subtitle">Variantes</p>
        <p className="mt-1 text-2xl font-extrabold admin-title">
          {stats.totalVariants}
        </p>
        <div className="mt-3 inline-flex rounded-lg border admin-border p-2 text-emerald-400 admin-surface-soft">
          <Layers className="h-4 w-4" />
        </div>
      </article>
      <article className="soft-card p-4">
        <p className="text-xs admin-subtitle">Stock bajo</p>
        <p className="mt-1 text-2xl font-extrabold admin-title">
          {stats.lowStockCount}
        </p>
        <div className="mt-3 inline-flex rounded-lg border admin-border p-2 text-amber-400 admin-surface-soft">
          <Package className="h-4 w-4" />
        </div>
      </article>
      <article className="soft-card p-4">
        <p className="text-xs admin-subtitle">Categorias</p>
        <p className="mt-1 text-2xl font-extrabold admin-title">
          {stats.totalCategories}
        </p>
        <div className="mt-3 inline-flex rounded-lg border admin-border p-2 text-sky-400 admin-surface-soft">
          <Tags className="h-4 w-4" />
        </div>
      </article>
    </section>
  );
}
