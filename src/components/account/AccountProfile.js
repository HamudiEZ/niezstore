import SectionCard from "@/components/ui/section-card";
import { User, Mail, Shield } from "lucide-react";

export default function AccountProfile({ user }) {
  return (
    <div className="space-y-6">
      <SectionCard>
        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded-2xl bg-[var(--surface-soft)] flex items-center justify-center text-[var(--accent)] border border-[var(--border)]">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--foreground)] leading-tight uppercase tracking-tight">
              {user.fullName}
            </h2>
            <p className="text-sm text-[var(--muted)] underline-offset-4">Información de tu cuenta personal</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5 group">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
              <User className="h-3 w-3" />
              Nombre completo
            </div>
            <div className="h-12 flex items-center px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/40 text-sm font-medium text-[var(--foreground)]">
              {user.fullName}
            </div>
          </div>

          <div className="space-y-1.5 group">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
              <Mail className="h-3 w-3" />
              Correo electrónico
            </div>
            <div className="h-12 flex items-center px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/40 text-sm font-medium text-[var(--foreground)]">
              {user.email}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Admin Quick Link if applicable */}
      {user.role === "ADMIN" && (
        <SectionCard className="border-[var(--accent)]/30 bg-[var(--surface-soft)]/50">
          <div className="flex items-center justify-between gap-4">
             <div className="flex items-center gap-3">
               <Shield className="h-5 w-5 text-[var(--accent)]" />
               <div>
                  <p className="text-sm font-bold text-[var(--foreground)]">Acceso Administrativo Detectado</p>
                  <p className="text-[11px] text-[var(--muted)]">Tenés permisos para gestionar el catálogo y ventas.</p>
               </div>
             </div>
             <a href="/admin" className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-slate-950 hover:brightness-110 transition-all capitalize">
                Panel Admin
             </a>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
