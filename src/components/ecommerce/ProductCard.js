import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import RatingStars from "./RatingStars";

export default function ProductCard({ product }) {
  const hasImage = Boolean(product.imageUrl);
  const hasDiscount = product.discountPercentage != null && product.discountPercentage > 0;
  const hasRating = product.rating != null && product.reviews != null;
  const priceLabel =
    typeof product.price === "number" ? product.price.toFixed(2) : "--";
  const previousPriceLabel =
    typeof product.previousPrice === "number"
      ? product.previousPrice.toFixed(2)
      : null;

  return (
    <Link
      href={`/producto/${product.id}`}
      className="group rounded-xl border border-slate-700 bg-slate-900/80 p-3 transition hover:-translate-y-0.5 hover:border-cyan-400/70 hover:shadow-2xl"
    >
      <div className="relative overflow-hidden rounded-lg bg-slate-800">
        {hasImage ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={320}
            height={240}
            className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-40 w-full items-center justify-center text-xs text-slate-400">
            Sin imagen
          </div>
        )}
        {hasDiscount ? (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-slate-950">
            -{product.discountPercentage}%
          </span>
        ) : null}
        <button
          type="button"
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/85 text-slate-300 shadow-sm transition hover:text-rose-400"
          aria-label="Agregar a favoritos"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3">
        <p className="line-clamp-2 text-sm font-semibold text-slate-100">
          {product.name}
        </p>
        {hasRating ? (
          <RatingStars value={product.rating} reviews={product.reviews} />
        ) : null}

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-extrabold tracking-tight text-slate-100">
            ${priceLabel}
          </span>
          {previousPriceLabel ? (
            <span className="text-xs text-slate-400 line-through">
              ${previousPriceLabel}
            </span>
          ) : null}
        </div>

        <p className="mt-1 text-xs text-emerald-300">Envio rapido disponible</p>
      </div>
    </Link>
  );
}
