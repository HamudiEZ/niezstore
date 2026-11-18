"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import PageShell from "@/components/ui/page-shell";
import { Button, getButtonClass } from "@/components/ui/button";

export default function GlobalErrorPage({ reset }) {
  return (
    <PageShell>
      <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/20 px-6 py-16 text-center">
        <div className="mb-4 rounded-full bg-rose-500/10 p-4 text-rose-400">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] md:text-3xl">
          Algo salió mal
        </h1>
        <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
          Ocurrió un error inesperado al cargar esta sección. Podés reintentar o volver al inicio.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" onClick={() => reset?.()} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Intentar de nuevo
          </Button>
          <Link href="/" className={getButtonClass({ variant: "outline" })}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
