import clsx from "clsx";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import RatingStars from "./RatingStars";

export default function ProductCard({ product, variant = "grid" }) {
  const isRail = variant === "rail";
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

  return (
    <Link
      href={`/producto/${product.slug || product.id}`}
      className={clsx(
        "group flex max-w-full flex-col rounded-xl border border-slate-700 bg-slate-900/80 transition hover:-translate-y-0.5 hover:border-cyan-400/70 hover:shadow-2xl",
        isRail
          ? "h-full min-h-[19.5rem] w-[11.25rem] shrink-0 overflow-hidden p-0 sm:min-h-[20.5rem] sm:w-[12.5rem]"
          : "min-w-0 p-3",
      )}
    >
      <div
        className={clsx(
          "w-full shrink-0",
          !isRail && "flex justify-center",
        )}
      >
        <div
          className={clsx(
            "relative isolate aspect-square min-w-0 overflow-hidden bg-slate-800",
            isRail
              ? "w-full"
              : "w-full max-w-[9.5rem] rounded-lg sm:max-w-[10.25rem]",
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
            <span className="absolute left-2 top-2 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-slate-950">
              -{product.discountPercentage}%
            </span>
          ) : null}
          <button
            type="button"
            className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/85 text-slate-300 shadow-sm transition hover:text-rose-400"
            aria-label="Agregar a favoritos"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={clsx(
          "min-w-0",
          isRail
            ? "flex flex-1 flex-col px-3 pb-3 pt-3"
            : "mt-3",
        )}
      >
        <p
          className={clsx(
            "line-clamp-2 font-semibold text-slate-100",
            isRail ? "text-sm leading-snug" : "text-sm",
          )}
        >
          {product.name}
        </p>
        {hasRating ? (
          <RatingStars value={product.rating} reviews={product.reviews} />
        ) : null}

        <div
          className={clsx(
            "flex flex-wrap items-baseline gap-2",
            isRail ? "mt-auto pt-3" : "mt-2",
          )}
        >
          <span className="text-lg font-extrabold tracking-tight text-slate-100">
            ${priceLabel}
          </span>
          {previousPriceLabel ? (
            <span className="text-xs text-slate-400 line-through">
              ${previousPriceLabel}
            </span>
          ) : null}
        </div>

        <p className="mt-1.5 text-xs text-emerald-300">Envío rápido disponible</p>
      </div>
    </Link>
  );
}
