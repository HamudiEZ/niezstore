import { Button } from "../ui/button";

export default function ProductOptions({
  selectedProduct,
  form,
  message,
  disabled,
  onChange,
  onSubmit,
}) {
  return (
    <div className="space-y-3">
      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Nueva opcion</h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Define atributos que cambian la variante (Color, RAM, Tamaño).
          </p>
        </div>
        <input
          name="name"
          value={form.name}
          onChange={onChange}
          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
          placeholder="Nombre de la opcion (ej: Color, RAM, Tamano)"
        />
        <input
          name="values"
          value={form.values}
          onChange={onChange}
          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
          placeholder="Valores (ej: Negro, Blanco, Azul)"
        />
        <p className="text-[11px] text-slate-500">
          Escribe los valores separados por coma.
        </p>
        <details className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-400 light-card">
          <summary className="cursor-pointer text-slate-300">
            Orden avanzado (opcional)
          </summary>
          <div className="mt-2">
            <input
              name="position"
              value={form.position}
              onChange={onChange}
              type="number"
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100"
              placeholder="Orden de la opcion (opcional)"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Define el orden en que aparece esta opcion. Si lo dejas vacio, usa 0.
            </p>
          </div>
        </details>
        <Button type="submit" disabled={disabled}>
          {disabled ? "Guardando..." : "Agregar opcion"}
        </Button>
        {message ? <p className="text-xs text-cyan-300">{message}</p> : null}
      </form>

      <div>
        <h3 className="text-sm font-semibold text-slate-100">Opciones actuales</h3>
        {selectedProduct.options?.length ? (
          <div className="mt-2 space-y-2">
            {selectedProduct.options.map((option) => (
              <div
                key={option.id}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
              >
                <p className="text-sm font-semibold text-slate-100">{option.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {option.values.map((value) => (
                    <span
                      key={value.id}
                      className="option-pill rounded-full px-2 py-0.5 text-[11px]"
                    >
                      {value.value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-400">Sin opciones creadas.</p>
        )}
      </div>
    </div>
  );
}
