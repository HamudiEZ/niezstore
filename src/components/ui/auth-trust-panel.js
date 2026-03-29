import { CreditCard, ShieldCheck, Truck } from "lucide-react";
import SectionCard from "./section-card";

const TRUST_ITEMS = [
  {
    id: "secure",
    icon: ShieldCheck,
    title: "Acceso y compra segura",
    description: "Protegemos tu cuenta y tus datos con practicas de seguridad actuales.",
  },
  {
    id: "shipping",
    icon: Truck,
    title: "Envio confiable",
    description: "Seguimiento en tiempo real y entrega rapida en zonas principales.",
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Pagos verificados",
    description: "Tarjeta, transferencia y metodos locales validados por la plataforma.",
  },
];

export default function AuthTrustPanel({ className = "" }) {
  return (
    <SectionCard
      className={`hidden lg:block ${className}`.trim()}
      title="Compra con confianza"
      description="Inicia sesion o crea tu cuenta para continuar con una experiencia segura."
      titleClassName="section-title text-slate-100"
    >
      <div className="space-y-2">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-900/55 p-3"
            >
              <div className="flex items-start gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-cyan-300">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
