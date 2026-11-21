"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { getButtonClass } from "@/components/ui/button";
import PageShell from "@/components/ui/page-shell";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("order") || "N/A";

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <CheckCircle2 className="h-12 w-12" />
        </div>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] md:text-5xl">
        ¡Pedido confirmado!
      </h1>

      <p className="mt-4 max-w-md text-base text-[var(--muted)]">
        Gracias por tu compra. Hemos recibido tu pedido y comenzaremos a prepararlo pronto.
      </p>

      <div className="mt-8 flex flex-col w-full max-w-md items-center gap-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6 shadow-[0_0_20px_rgba(34,211,238,0.05)]">
        <div className="flex items-center gap-2 text-cyan-400">
          <Package className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Número de Orden</span>
        </div>
        <span className="w-full text-center text-base sm:text-lg font-mono font-bold text-[var(--foreground)] break-all leading-relaxed">
          {orderCode}
        </span>
        <p className="text-xs text-[var(--muted)]">
          Por favor guardá este número para cualquier consulta.
        </p>
      </div>

      <div className="mt-12">
        <Link
          href="/"
          className={getButtonClass({ size: "lg", className: "font-bold gap-2" })}
        >
          Seguir comprando
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <PageShell>
      <Suspense fallback={
        <div className="flex h-64 items-center justify-center text-[var(--muted)]">
          Cargando confirmación...
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </PageShell>
  );
}
