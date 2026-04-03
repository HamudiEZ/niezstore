import SectionCard from "@/components/ui/section-card";
import { ShieldCheck, Key, Lock } from "lucide-react";

export default function AccountSecurity() {
  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-2xl bg-[var(--surface-soft)] flex items-center justify-center text-[var(--accent)] border border-[var(--border)]">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--foreground)] leading-tight uppercase tracking-tight">
              Seguridad
            </h2>
            <p className="text-sm text-[var(--muted)]">Gestioná la protección de tu acceso.</p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/20 hover:border-[var(--accent)]/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
             <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-[var(--accent)] opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                <div>
                   <p className="text-sm font-bold text-[var(--foreground)] uppercase tracking-tight">Contraseña</p>
                   <p className="text-[10px] text-[var(--muted)] font-medium">Cambia tu contraseña periodicamente.</p>
                </div>
             </div>
             <button className="bg-[var(--surface-soft)] px-4 py-2 rounded-xl text-[10px] font-black uppercase text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--accent)] hover:text-slate-950 transition-colors shadow-sm active:scale-95">
                Cambiar
             </button>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/10 hover:border-[var(--accent)]/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-default">
             <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-[var(--accent)] opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                <div>
                   <p className="text-sm font-bold text-[var(--foreground)] uppercase tracking-tight">Doble Factor (2FA)</p>
                   <p className="text-[10px] text-[var(--muted)] font-medium">Proximamente disponible.</p>
                </div>
             </div>
             <span className="bg-[var(--surface-soft)] px-3 py-1 rounded-lg text-[9px] font-black uppercase text-[var(--muted)] border border-[var(--border)] opacity-60">
                Próximamente
             </span>
          </div>
        </div>

        <p className="mt-8 text-[11px] text-[var(--muted)] text-center font-medium">
          Niez Store utiliza cifrado de nivel bancario para proteger tus datos.
        </p>
      </SectionCard>
    </div>
  );
}
