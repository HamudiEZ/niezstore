"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import PageShell from "@/components/ui/page-shell";
import PageHeader from "@/components/ui/page-header";
import ProductCard from "@/components/ecommerce/ProductCard";
import SearchPagination from "@/components/ui/search-pagination";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useMounted } from "@/lib/use-mounted";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function FavoritesContent() {
  const { favorites } = useFavoritesStore();
  const mounted = useMounted();
  const searchParams = useSearchParams();
  const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(favorites.length / pageSize));
  const safePage = Math.min(Math.max(1, Number.isFinite(rawPage) ? rawPage : 1), totalPages);

  if (!mounted) {
    return (
      <PageHeader title="Mis Favoritos" description="Cargando tus productos guardados..." />
    );
  }

  if (favorites.length === 0) {
    return (
      <>
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
          <Link href="/" className="hover:text-cyan-500 transition">Inicio</Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">Favoritos</span>
        </div>

        <PageHeader
          title="Mis Favoritos"
          description="Empezá a armar tu lista de deseos guardando los productos que más te gustan."
        />

        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/20 py-16 px-6 text-center">
          <div className="mb-4 rounded-full bg-[var(--surface-soft)] p-4">
            <Heart className="h-6 w-6 text-[var(--muted)]" />
          </div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Aún no hay favoritos</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            No guardaste ningún producto todavía. ¡Explorá el catálogo y sumalos a tu lista!
          </p>
          <Link
            href="/categorias"
            className="mt-6 rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-bold text-[#000] transition hover:bg-cyan-300"
          >
            Explorar productos
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Breadcrumbs */}
      <div className="mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
        <Link href="/" className="hover:text-cyan-500 transition">Inicio</Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">Favoritos</span>
      </div>

      <PageHeader
        title="Mis Favoritos"
        description={`Tenés ${favorites.length} producto(s) guardado(s).`}
      />

      <div className="mt-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 w-full">
            {favorites
              .slice((safePage - 1) * pageSize, safePage * pageSize)
              .map((product) => (
                <ProductCard key={product.id} product={product} variant="list" />
              ))}
          </div>

          {favorites.length > pageSize && (
            <div className="mt-4 flex justify-center border-t border-[var(--border)] py-8">
              <SearchPagination
                page={safePage}
                totalPages={totalPages}
                totalItems={favorites.length}
                pageSize={pageSize}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function FavoritesPage() {
  return (
    <PageShell>
      <Suspense fallback={
        <div className="flex h-64 items-center justify-center text-[var(--muted)]">
          Cargando favoritos...
        </div>
      }>
        <FavoritesContent />
      </Suspense>
    </PageShell>
  );
}
