"use client";

import {
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import QuantityControl from "@/components/ui/quantity-control";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { Button } from "../ui/button";
import PageShell from "../ui/page-shell";
import ProductCard from "./ProductCard";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { Heart } from "lucide-react";
import clsx from "clsx";

const formatPrice = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "0.00";
const EMPTY_LIST = [];

function getDiscountPercentage(compareAtPrice, price) {
  if (
    typeof compareAtPrice !== "number" ||
    typeof price !== "number" ||
    !Number.isFinite(compareAtPrice) ||
    !Number.isFinite(price) ||
    compareAtPrice <= price
  ) {
    return null;
  }

  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

function isCompleteVariantForOptions(variant, options) {
  if (!options?.length) return true;
  return options.every((option) =>
    Boolean(variant?.optionValueMap?.[option.id]),
  );
}

function buildDefaultSelections(product) {
  const options = product.options ?? [];
  if (options.length === 0) return {};

  const variants = product.variants ?? [];
  const firstVariant =
    variants.find((variant) => isCompleteVariantForOptions(variant, options)) ||
    variants[0];
  const defaults = {};
  options.forEach((option) => {
    defaults[option.id] =
      firstVariant?.optionValueMap?.[option.id] || option.values?.[0]?.id || "";
  });
  return defaults;
}

function variantMatchesSelections(
  variant,
  options,
  selections,
  requireComplete = false,
) {
  return options.every((option) => {
    const selectedValueId = selections[option.id];
    if (!selectedValueId) return !requireComplete;
    return variant.optionValueMap?.[option.id] === selectedValueId;
  });
}

function findVariantBySelections(
  variants,
  options,
  selections,
  requireComplete = false,
) {
  return (
    variants.find((variant) =>
      variantMatchesSelections(variant, options, selections, requireComplete),
    ) || null
  );
}

function buildGallery(product, variant) {
  const seen = new Set();
  const gallery = [];

  const pushImage = (url, label, key) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    gallery.push({ key, url, label });
  };

  if (variant?.imageUrl) {
    pushImage(
      variant.imageUrl,
      `${product.name} variante`,
      `variant-${variant.id}`,
    );
  }
  (product.images ?? []).forEach((image) => {
    pushImage(image.url, product.name, image.id);
  });

  if (gallery.length === 0) {
    gallery.push({ key: "fallback", url: null, label: product.name });
  }

  return gallery;
}

export default function ProductDetailView({ product, relatedProducts = [] }) {
  const options = product.options || EMPTY_LIST;
  const variants = product.variants || EMPTY_LIST;
  const effectiveVariants = useMemo(() => {
    if (options.length === 0) return variants;
    return variants.filter((variant) =>
      isCompleteVariantForOptions(variant, options),
    );
  }, [variants, options]);
  const [selectedValues, setSelectedValues] = useState(() =>
    buildDefaultSelections(product),
  );
  const [quantity, setQuantity] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const { isAuthenticated } = useAuthStore();
  const isFav = mounted ? isFavorite(product.id) : false;

  const handleToggleFavorite = () => {
    toggleFavorite({
      id: product.id,
      name: product.name,
      slug: product.slug || product.id,
      brand: product.brand,
      imageUrl: product.images?.[0]?.url || product.variants?.[0]?.imageUrl || "",
      price: selectedVariant?.price,
      previousPrice: selectedVariant?.compareAtPrice,
      discountPercentage: getDiscountPercentage(selectedVariant?.compareAtPrice, selectedVariant?.price),
    }, isAuthenticated);
  };

  const { addItem: addCartItem } = useCartStore();
  const [addedFeedback, setAddedFeedback] = useState(false);

  const handleAddToCart = () => {
    if (isOutOfStock || !selectedVariant) return;

    addCartItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
      },
      {
        id: selectedVariant.id,
        sku: selectedVariant.sku,
        price: selectedVariant.price,
        compareAtPrice: selectedVariant.compareAtPrice,
        imageUrl: selectedVariant.imageUrl,
        stock: selectedVariant.stock,
        summary: selectedVariantSummary
      },
      parseInt(quantity) || 1,
      isAuthenticated
    );

    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const selectedVariant = useMemo(() => {
    if (effectiveVariants.length === 0) return null;
    if (options.length === 0) return effectiveVariants[0];
    return (
      findVariantBySelections(
        effectiveVariants,
        options,
        selectedValues,
        true,
      ) ||
      findVariantBySelections(
        effectiveVariants,
        options,
        selectedValues,
        false,
      ) ||
      effectiveVariants[0]
    );
  }, [effectiveVariants, options, selectedValues]);

  const selectedVariantSummary = useMemo(() => {
    if (options.length === 0) return "Variante unica";
    return options
      .map((option) => {
        const selectedValueId = selectedValues[option.id];
        const selectedValue = option.values.find(
          (value) => value.id === selectedValueId,
        );
        return selectedValue ? `${option.name}: ${selectedValue.value}` : null;
      })
      .filter(Boolean)
      .join(" | ");
  }, [options, selectedValues]);

  const stock = selectedVariant?.stock ?? 0;
  const isOutOfStock = !selectedVariant || stock <= 0;
  const maxQuantity = stock > 0 ? stock : 1;

  useEffect(() => {
    if (quantity > maxQuantity) {
      setQuantity(Math.max(1, maxQuantity));
    }
  }, [maxQuantity, quantity]);

  const gallery = useMemo(
    () => buildGallery(product, selectedVariant),
    [product, selectedVariant],
  );
  const [preferredImageUrl, setPreferredImageUrl] = useState(null);
  const activeImageUrl = useMemo(() => {
    if (
      preferredImageUrl &&
      gallery.some((image) => image.url === preferredImageUrl)
    ) {
      return preferredImageUrl;
    }
    return gallery[0]?.url || null;
  }, [gallery, preferredImageUrl]);

  const isValueAvailable = (optionId, valueId) => {
    if (options.length === 0) return true;
    return effectiveVariants.some((variant) => {
      if (variant.optionValueMap?.[optionId] !== valueId) return false;

      return options.every((option) => {
        if (option.id === optionId) return true;
        const selectedValueId = selectedValues[option.id];
        if (!selectedValueId) return true;
        return variant.optionValueMap?.[option.id] === selectedValueId;
      });
    });
  };

  const handleSelectOptionValue = (optionId, valueId) => {
    setSelectedValues((current) => {
      const next = { ...current, [optionId]: valueId };
      const exactMatch = findVariantBySelections(
        effectiveVariants,
        options,
        next,
        true,
      );
      if (exactMatch) return next;

      const compatibleVariant = effectiveVariants.find(
        (variant) => variant.optionValueMap?.[optionId] === valueId,
      );
      if (!compatibleVariant) return next;

      const rebalanced = { ...next };
      options.forEach((option) => {
        const mappedValueId = compatibleVariant.optionValueMap?.[option.id];
        if (mappedValueId) rebalanced[option.id] = mappedValueId;
      });

      return rebalanced;
    });
  };

  const price = selectedVariant?.price ?? null;
  const compareAtPrice = selectedVariant?.compareAtPrice ?? null;
  const discountPercentage = getDiscountPercentage(compareAtPrice, price);
  const isLowStock = stock > 0 && stock <= 5;
  const displayQuantity = Math.max(1, Math.min(quantity, maxQuantity));
  const categoryName = product.category?.name || "Categoria";
  const categorySlug = product.category?.slug;

  return (
    <PageShell gap="lg">
      <nav className="flex items-center gap-2 text-xs text-slate-500 min-w-0 overflow-hidden">
        <Link href="/" className="shrink-0 hover:text-cyan-300">
          Inicio
        </Link>
        <span className="shrink-0">/</span>
        {categorySlug ? (
          <Link
            href={`/categoria/${categorySlug}`}
            className="shrink-0 hover:text-cyan-300"
          >
            {categoryName}
          </Link>
        ) : (
          <span className="shrink-0">{categoryName}</span>
        )}
        <span className="shrink-0">/</span>
        <span className="truncate text-slate-300">{product.name}</span>
      </nav>

      <section className="grid gap-12 lg:grid-cols-[1.3fr_1fr] items-start">
        <div className="lg:sticky lg:top-24 space-y-6">
          <div>
            <div className="relative overflow-hidden rounded-3xl border border-[#22304b40] bg-surface-soft/20 shadow-sm">
              <div className="relative aspect-square">
                {activeImageUrl ? (
                  <Image
                    src={activeImageUrl}
                    alt={product.name}
                    fill
                    priority={true}
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 760px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                    Sin imagen disponible
                  </div>
                )}
              </div>

              {gallery.length > 1 && (() => {
                const activeIndex = gallery.findIndex((img) => img.url === activeImageUrl);
                const prevIndex = (activeIndex - 1 + gallery.length) % gallery.length;
                const nextIndex = (activeIndex + 1) % gallery.length;
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setPreferredImageUrl(gallery[prevIndex].url)}
                      className="product-carousel__arrow product-carousel__arrow--left"
                      aria-label="Imagen anterior"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredImageUrl(gallery[nextIndex].url)}
                      className="product-carousel__arrow product-carousel__arrow--right"
                      aria-label="Imagen siguiente"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  </>
                );
              })()}

              {discountPercentage ? (
                <span className="absolute left-3 top-3 rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-bold text-[var(--primary-foreground)]">
                  -{discountPercentage}% OFF
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 px-1">
              {gallery.map((image, index) => {
                const isActive = image.url === activeImageUrl;
                return (
                  <button
                    key={image.key}
                    type="button"
                    onClick={() => setPreferredImageUrl(image.url)}
                    className={`overflow-hidden rounded-xl border transition ${
                      isActive
                        ? "border-[var(--accent)] shadow-[0_0_0_1px_var(--accent)]"
                        : "border-[var(--border)] hover:border-[var(--muted)]"
                    }`}
                    aria-label={`Seleccionar imagen ${index + 1}`}
                  >
                    {image.url ? (
                      <Image
                        src={image.url}
                        alt={image.label}
                        width={120}
                        height={100}
                        className="h-16 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-full items-center justify-center bg-slate-900 text-[11px] text-slate-400">
                        Sin imagen
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-3 mt-8">
              <div className="soft-card p-4 transition-all hover:border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-xs">Envío express</p>
                    <p className="text-[10px] text-muted leading-tight">24-48h zonas principales</p>
                  </div>
                </div>
              </div>
              <div className="soft-card p-4 transition-all hover:border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-xs">Garantía real</p>
                    <p className="text-[10px] text-muted leading-tight">12 meses soporte local</p>
                  </div>
                </div>
              </div>
              <div className="soft-card p-4 transition-all hover:border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-xs">Pagos seguros</p>
                    <p className="text-[10px] text-muted leading-tight">Tarjeta y cuotas</p>
                  </div>
                </div>
              </div>
            </div>
        </div>

        <div className="flex min-w-0 flex-col overflow-hidden py-2 lg:py-6 lg:pl-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
            <span className="truncate max-w-[200px] rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1">
              {product.brand || "Niez Store"}
            </span>
            <span className="truncate max-w-[200px] rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1">
              {categoryName}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4 mt-4">
            <h1
              className="text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl lg:text-4xl line-clamp-3"
              style={{ overflowWrap: "anywhere" }}
            >
              {product.name}
            </h1>
            <button
              onClick={handleToggleFavorite}
              className={clsx(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all",
                isFav
                  ? "border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                  : "border-slate-800 bg-surface-soft/30 text-slate-400 hover:text-rose-400 hover:border-slate-700"
              )}
              aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <Heart className="h-6 w-6" fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-3 border-b border-[var(--border)] pb-6">
            <span className="text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
              ${formatPrice(price)}
            </span>
            {compareAtPrice ? (
              <span className="pb-1 text-sm font-medium text-[var(--muted)] line-through">
                ${formatPrice(compareAtPrice)}
              </span>
            ) : null}
            {discountPercentage ? (
              <span className="mb-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Ahorras {discountPercentage}%
              </span>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`pdp-stock-pill ${
                isOutOfStock
                  ? "pdp-stock-pill--none"
                  : isLowStock
                    ? "pdp-stock-pill--low"
                    : "pdp-stock-pill--ok"
              }`}
            >
              {isOutOfStock
                ? "Sin stock"
                : isLowStock
                  ? `Quedan ${stock} unidades`
                  : `Stock disponible: ${stock}`}
            </span>
            {selectedVariant?.sku ? (
              <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-slate-300">
                SKU: {selectedVariant.sku}
              </span>
            ) : null}
          </div>

          {options.length > 0 ? (
            <div className="mt-6 space-y-5">
              {options.map((option) => {
                const selectedValueId = selectedValues[option.id];
                const selectedValue = option.values.find(
                  (value) => value.id === selectedValueId,
                );
                return (
                  <div key={option.id}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {option.name}
                      {selectedValue ? (
                        <span className="pdp-inline-accent ml-2 normal-case tracking-normal">
                          {selectedValue.value}
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {option.values.map((value) => {
                        const isSelected = selectedValueId === value.id;
                        const available = isValueAvailable(option.id, value.id);
                        return (
                          <button
                            key={value.id}
                            type="button"
                            onClick={() =>
                              handleSelectOptionValue(option.id, value.id)
                            }
                            disabled={!available}
                            className={`pdp-option-chip ${
                              isSelected
                                ? "pdp-option-chip--selected"
                                : available
                                  ? ""
                                  : "pdp-option-chip--disabled"
                            }`}
                          >
                            {value.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <p className="text-[11px] text-slate-500">
                Selección actual: {selectedVariantSummary || "Sin seleccionar"}
              </p>
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            <p
              className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-6"
              style={{ overflowWrap: "anywhere" }}
            >
              {product.description}
            </p>
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
              <QuantityControl
                value={quantity}
                onChange={setQuantity}
                max={maxQuantity}
                disabled={isOutOfStock}
                allowInput={true}
                size="md"
              />

              <div className="flex w-full flex-col gap-2 sm:flex-row">
                <Button
                  size="lg"
                  className={clsx(
                    "w-full text-sm font-bold transition-all",
                    addedFeedback ? "bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)]" : ""
                  )}
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                >
                  {isOutOfStock ? "No disponible" : addedFeedback ? "¡Agregado al carrito!" : "Agregar al carrito"}
                </Button>
                <Link href="/checkout" className="w-full">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full text-sm font-bold"
                    disabled={isOutOfStock}
                    onClick={() => {
                        if (!isOutOfStock) handleAddToCart();
                    }}
                  >
                    Comprar ahora
                  </Button>
                </Link>
              </div>

            </div>

            <p className="text-center text-[10px] text-slate-500 sm:text-left">
              Checkout y carrito en proceso. Esta vista ya deja preparada la
              selección de variante.
            </p>
          </div>

          <div className="mt-8 border-t border-slate-800 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-4 text-sm">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">
                    Producto original
                  </p>
                  <p className="text-[11px] text-muted leading-tight">
                    Validamos lote y estado antes del despacho.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 text-sm">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Devoluciones</p>
                  <p className="text-[11px] text-muted leading-tight">
                    Gestión simple dentro del plazo de política.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">

        <aside className="soft-card p-4 md:p-5">
          <h2 className="section-title text-slate-100">Ficha rapida</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {product.brand && (
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 min-w-0">
                <dt className="shrink-0 text-slate-400">Marca</dt>
                <dd className="truncate font-semibold text-slate-100">
                  {product.brand}
                </dd>
              </div>
            )}
            {categoryName && (
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 min-w-0">
                <dt className="shrink-0 text-slate-400">Categoria</dt>
                <dd className="truncate font-semibold text-slate-100">{categoryName}</dd>
              </div>
            )}
            {selectedVariantSummary && (
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 min-w-0">
                <dt className="shrink-0 text-slate-400">Variante activa</dt>
                <dd className="truncate font-semibold text-slate-100">
                  {selectedVariantSummary}
                </dd>
              </div>
            )}
            {selectedVariant?.sku && (
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 min-w-0">
                <dt className="shrink-0 text-slate-400">SKU</dt>
                <dd className="truncate font-semibold text-slate-100">
                  {selectedVariant.sku}
                </dd>
              </div>
            )}
            {stock !== undefined && (
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
                <dt className="text-slate-400">Stock</dt>
                <dd className="font-semibold text-slate-100">{stock}</dd>
              </div>
            )}
            {effectiveVariants?.length > 0 && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">Variantes totales</dt>
                <dd className="font-semibold text-slate-100">
                  {effectiveVariants.length}
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="soft-card p-4 md:p-5">
          <h2 className="section-title text-slate-100">
            Que incluye tu compra
          </h2>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-300" />
              Producto en empaque original.
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-300" />
              Factura y garantia local.
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-300" />
              Soporte postventa por canales oficiales.
            </p>
          </div>
        </article>

        <article className="soft-card p-4 md:p-5">
          <h2 className="section-title text-slate-100">Preguntas frecuentes</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <details className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
              <summary className="cursor-pointer font-semibold text-slate-100">
                Puedo cambiar de variante luego de comprar?
              </summary>
              <p className="mt-2 text-xs text-slate-400">
                Si el pedido aun no se despacho, podemos ajustar color o
                capacidad segun stock.
              </p>
            </details>
            <details className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
              <summary className="cursor-pointer font-semibold text-slate-100">
                La garantia aplica a todas las variantes?
              </summary>
              <p className="mt-2 text-xs text-slate-400">
                Si, la garantia se mantiene sin importar la variante elegida del
                mismo producto.
              </p>
            </details>
          </div>
        </article>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="soft-card p-4 md:p-5">
          <h2 className="section-title text-slate-100">
            Tambien te puede interesar
          </h2>
          <div className="mt-4 grid shop-card-grid sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
