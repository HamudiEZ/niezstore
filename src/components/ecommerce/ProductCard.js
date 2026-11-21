"use client";

import clsx from "clsx";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import RatingStars from "./RatingStars";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useAuthStore } from "@/store/authStore";
import { useMounted } from "@/lib/use-mounted";

export default function ProductCard({ product, variant = "grid" }) {
  const isRail = variant === "rail";
  const isList = variant === "list";
  const hasImage = Boolean(product.imageUrl);
  const hasDiscount =
    product.discountPercentage != null && product.discountPercentage > 0;
  const hasRating = product.rating != null && product.reviews != null;
  const priceLabel =
    typeof product.price === "number" ? product.price.toFixed(2) : "--";
  const previousPriceLabel =
    typeof product.previousPrice === "number"
      ? product.previousPrice.toFixed(2)
      : null;

  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { isAuthenticated } = useAuthStore();
  const mounted = useMounted();

  const isFav = mounted ? isFavorite(product.id) : false;

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    toggleFavorite({
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      imageUrl: product.imageUrl,
      price: product.price,
      previousPrice: product.previousPrice,
      discountPercentage: product.discountPercentage,
    }, isAuthenticated);
  };

  return (
    <Link
      href={`/producto/${product.slug || product.id}`}
      className={clsx(
        "group flex max-w-full rounded-xl border border-slate-700 bg-slate-900/80 transition hover:-translate-y-0.5 hover:border-cyan-400/70 hover:shadow-2xl",
        isRail && "flex-col h-full min-h-[19.5rem] w-[11.25rem] shrink-0 overflow-hidden p-0 sm:min-h-[20.5rem] sm:w-[12.5rem]",
        !isRail && !isList && "flex-col min-w-0 p-3",
        isList && "flex-row h-auto min-h-[10rem] sm:h-40 min-w-0 overflow-hidden"
      )}
    >
      <div
        className={clsx(
          "shrink-0",
          !isRail && !isList && "w-full flex justify-center",
          isRail && "w-full",
          isList && "w-28 sm:w-40 border-r border-slate-800"
        )}
      >
        <div
          className={clsx(
            "relative isolate aspect-square min-w-0 overflow-hidden bg-slate-800",
            (isRail || isList) ? "w-full h-full" : "w-full max-w-[9.5rem] rounded-lg sm:max-w-[10.25rem]",
          )}
        >
          {hasImage ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes={
                isRail
                  ? "(max-width: 639px) 180px, 200px"
                  : "(max-width: 639px) 160px, 164px"
              }
              className="z-0 object-cover object-center transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
              Sin imagen
            </div>
          )}
          {hasDiscount ? (
            <span className="absolute left-2 top-2 z-10 rounded-full bg-[var(--primary)] px-2 py-0.5 text-[11px] font-semibold text-[var(--primary-foreground)]">
              -{product.discountPercentage}%
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={clsx(
              "absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition",
              isFav
                ? "bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400"
                : "bg-[var(--background)]/85 text-[var(--muted)] hover:text-rose-400"
            )}
            aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Heart className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div
        className={clsx(
          "min-w-0 flex flex-1 flex-col",
          isRail ? "px-3 pb-3 pt-3" : isList ? "p-3 sm:p-4 justify-center" : "mt-3",
        )}
      >
        <p
          className={clsx(
            "font-semibold text-slate-100",
            isRail ? "text-sm leading-snug line-clamp-2" : isList ? "text-sm sm:text-base line-clamp-2" : "text-sm line-clamp-2",
          )}
        >
          {product.name}
        </p>

        {isList && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-1 truncate">{product.brand || "Niez Store"}</p>
        )}

        {hasRating && !isList ? (
          <RatingStars value={product.rating} reviews={product.reviews} />
        ) : null}

        {isList ? (
          <div className="mt-auto pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-100">
                  ${priceLabel}
                </span>
                {previousPriceLabel ? (
                  <span className="text-sm text-slate-500 line-through">
                    ${previousPriceLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-emerald-300">Envío rápido disponible</p>
            </div>

            <div className="flex shrink-0">
              <span className="rounded-xl bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-[var(--background)] transition hover:opacity-90 w-full text-center sm:w-auto pointer-events-none">
                Ver detalle
              </span>
            </div>
          </div>
        ) : (
          <>
            <div
              className={clsx(
                "flex flex-wrap items-baseline gap-2",
                isRail ? "mt-auto pt-3" : "mt-2",
              )}
            >
              <span className="text-lg font-extrabold tracking-tight text-[var(--foreground)]">
                ${priceLabel}
              </span>
              {previousPriceLabel ? (
                <span className="text-xs text-[var(--muted)] line-through">
                  ${previousPriceLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-xs text-[var(--primary)]">Envío rápido disponible</p>
          </>
        )}
      </div>
    </Link>
  );
}
