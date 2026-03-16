import { Button } from "../ui/button";

export default function CategoryForm({ form, message, disabled, onChange, onSubmit }) {
  return (
    <article className="soft-card p-4 md:p-5">
      <h2 className="text-base font-bold text-slate-100">Crear categoria</h2>
      <p className="mt-1 text-xs text-slate-400">
        Define las categorias reales antes de crear productos.
      </p>

      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
          placeholder="Nombre de la categoria"
        />
        <input
          name="slug"
          value={form.slug}
          onChange={onChange}
          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
          placeholder="Slug (opcional)"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          placeholder="Descripcion (opcional)"
        />
        <Button type="submit" className="w-full" disabled={disabled}>
          {disabled ? "Creando..." : "Crear categoria"}
        </Button>
        {message ? <p className="text-xs text-cyan-300">{message}</p> : null}
      </form>
    </article>
  );
}
