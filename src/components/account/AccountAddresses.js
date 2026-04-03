import SectionCard from "@/components/ui/section-card";
import { MapPin, Home, Building, Plus } from "lucide-react";

export default function AccountAddresses() {
  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
           <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[var(--surface-soft)] flex items-center justify-center text-[var(--accent)] border border-[var(--border)]">
                <MapPin className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)] leading-tight uppercase tracking-tight">
                  Direcciones
                </h2>
                <p className="text-sm text-[var(--muted)]">Gestioná tus puntos de entrega para envíos rápidos.</p>
              </div>
           </div>
           
           <button className="btn-ui btn-ui--primary px-4 py-2 text-xs font-bold uppercase rounded-lg flex items-center gap-2">
              <Plus className="h-3 w-3" />
              Nueva
           </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="admin-list-item p-4 hover:border-[var(--accent)]/50 transition-all duration-300 group cursor-default">
             <div className="flex items-center justify-between mb-4">
                <div className="h-8 w-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                   <Home className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full uppercase tracking-widest border border-[var(--accent)]/20">
                   Predeterminada
                </span>
             </div>
             <p className="text-sm font-bold text-[var(--foreground)] uppercase tracking-tight">Casa Principal</p>
             <p className="text-[11px] text-[var(--muted)] font-medium leading-relaxed mt-1">Av. Mariscal Lopez 1234, Piso 2, Asunción, Paraguay.</p>
             <div className="mt-4 flex gap-4 pt-4 border-t border-[var(--border)]">
               <button className="btn-ui btn-ui--ghost px-3 py-1 text-[10px] font-bold uppercase rounded-md">Editar</button>
               <button className="btn-ui btn-ui--ghost px-3 py-1 text-[10px] font-bold uppercase rounded-md text-rose-500 hover:text-rose-600">Eliminar</button>
             </div>
          </div>

          {/* Add card placeholder */}
          <button className="admin-empty hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/[0.03] transition-all duration-300 group flex flex-col items-center justify-center text-center min-h-[160px]">
             <div className="h-10 w-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] group-hover:text-white transition-all duration-300 mb-3">
                <Plus className="h-5 w-5" />
             </div>
             <p className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest group-hover:text-[var(--accent)] transition-colors">Agregar nueva dirección</p>
          </button>
        </div>

        <p className="mt-8 text-[11px] text-[var(--muted)] text-center font-medium">
          Tus direcciones se usan para calcular el costo de envío de forma automática.
        </p>
      </SectionCard>
    </div>
  );
}
