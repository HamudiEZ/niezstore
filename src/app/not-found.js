import Link from "next/link";
import { PackageSearch } from "lucide-react";
import PageShell from "@/components/ui/page-shell";
import { getButtonClass } from "@/components/ui/button";

export const metadata = {
  title: "Página no encontrada | Niez Store",
};

export default function NotFoundPage() {
  return (
    <PageShell>
      <div className="flex min-h-[55vh] flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/20 px-6 py-16 text-center">
        <div className="mb-4 rounded-full bg-[var(--surface-soft)] p-4 text-[var(--muted)]">
          <PackageSearch className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] md:text-3xl">
          No encontramos esta página
        </h1>
        <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
          Es posible que el enlace haya cambiado o que el producto ya no esté disponible.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className={getButtonClass()}>
            Volver al inicio
          </Link>
          <Link href="/categorias" className={getButtonClass({ variant: "outline" })}>
            Ver categorías
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
