"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import ProductCard from "./ProductCard";
import { Button } from "../ui/button";
import PageShell from "../ui/page-shell";

const formatPrice = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "0.00";
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
  return options.every((option) => Boolean(variant?.optionValueMap?.[option.id]));
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

function variantMatchesSelections(variant, options, selections, requireComplete = false) {
  return options.every((option) => {
    const selectedValueId = selections[option.id];
    if (!selectedValueId) return !requireComplete;
    return variant.optionValueMap?.[option.id] === selectedValueId;
  });
}

function findVariantBySelections(variants, options, selections, requireComplete = false) {
  return (
    variants.find((variant) =>
      variantMatchesSelections(variant, options, selections, requireComplete)
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
    pushImage(variant.imageUrl, `${product.name} variante`, `variant-${variant.id}`);
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
    return variants.filter((variant) => isCompleteVariantForOptions(variant, options));
  }, [variants, options]);
  const [selectedValues, setSelectedValues] = useState(() => buildDefaultSelections(product));
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo(() => {
    if (effectiveVariants.length === 0) return null;
    if (options.length === 0) return effectiveVariants[0];
    return (
      findVariantBySelections(effectiveVariants, options, selectedValues, true) ||
      findVariantBySelections(effectiveVariants, options, selectedValues, false) ||
      effectiveVariants[0]
    );
  }, [effectiveVariants, options, selectedValues]);

  const selectedVariantSummary = useMemo(() => {
    if (options.length === 0) return "Variante unica";
    return options
      .map((option) => {
        const selectedValueId = selectedValues[option.id];
        const selectedValue = option.values.find((value) => value.id === selectedValueId);
        return selectedValue ? `${option.name}: ${selectedValue.value}` : null;
      })
      .filter(Boolean)
      .join(" | ");
  }, [options, selectedValues]);

  const gallery = useMemo(
    () => buildGallery(product, selectedVariant),
    [product, selectedVariant]
  );
  const [preferredImageUrl, setPreferredImageUrl] = useState(null);
  const activeImageUrl = useMemo(() => {
    if (preferredImageUrl && gallery.some((image) => image.url === preferredImageUrl)) {
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
      const exactMatch = findVariantBySelections(effectiveVariants, options, next, true);
      if (exactMatch) return next;

      const compatibleVariant = effectiveVariants.find(
        (variant) => variant.optionValueMap?.[optionId] === valueId
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
  const stock = selectedVariant?.stock ?? 0;
  const isOutOfStock = !selectedVariant || stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;
  const maxQuantity = stock > 0 ? stock : 1;
  const displayQuantity = Math.max(1, Math.min(quantity, maxQuantity));
  const categoryName = product.category?.name || "Categoria";
  const categorySlug = product.category?.slug;

  return (
    <PageShell gap="lg">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-cyan-300">
          Inicio
        </Link>
        <span>/</span>
        {categorySlug ? (
          <Link href={`/categoria/${categorySlug}`} className="hover:text-cyan-300">
            {categoryName}
          </Link>
        ) : (
          <span>{categoryName}</span>
        )}
        <span>/</span>
        <span className="text-slate-300">{product.name}</span>
      </nav>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="soft-card p-4 md:p-5">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
            <div className="relative aspect-[4/3]">
              {activeImageUrl ? (
                <Image
                  src={activeImageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 100vw, 760px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                  Sin imagen disponible
                </div>
              )}
            </div>

            {discountPercentage ? (
              <span className="absolute left-3 top-3 rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-slate-950">
                -{discountPercentage}% OFF
              </span>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {gallery.map((image, index) => {
              const isActive = image.url === activeImageUrl;
              return (
                <button
                  key={image.key}
                  type="button"
                  onClick={() => setPreferredImageUrl(image.url)}
                  className={`overflow-hidden rounded-xl border transition ${
                    isActive
                      ? "border-cyan-400/70 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]"
                      : "border-slate-800 hover:border-slate-600"
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

          <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <Truck className="h-4 w-4 text-cyan-300" />
                Envio express
              </div>
              <p className="mt-1 text-[11px] text-slate-400">24 a 48 horas en principales zonas.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Garantia real
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Cobertura por 12 meses con soporte local.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-slate-100">
                <CreditCard className="h-4 w-4 text-amber-300" />
                Pagos seguros
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Tarjeta, transferencia y cuotas.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <section className="soft-card p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1">
                {product.brand || "Niez Store"}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1">
                {categoryName}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">
              {product.name}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{product.description}</p>

            <div className="mt-5 flex flex-wrap items-end gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-100">
                ${formatPrice(price)}
              </span>
              {compareAtPrice ? (
                <span className="pb-1 text-sm text-slate-500 line-through">
                  ${formatPrice(compareAtPrice)}
                </span>
              ) : null}
              {discountPercentage ? (
                <span className="pdp-savings-pill">
                  Ahorras {discountPercentage}%
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
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
              <div className="mt-5 space-y-4">
                {options.map((option) => {
                  const selectedValueId = selectedValues[option.id];
                  const selectedValue = option.values.find((value) => value.id === selectedValueId);
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
                              onClick={() => handleSelectOptionValue(option.id, value.id)}
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
                  Seleccion actual: {selectedVariantSummary || "Sin seleccionar"}
                </p>
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                <span className="text-xs text-slate-400">Cantidad</span>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="h-7 w-7 rounded-full text-slate-300 transition hover:bg-slate-800"
                    aria-label="Disminuir cantidad"
                  >
                    -
                  </button>
                  <span className="min-w-6 text-center text-sm font-semibold text-slate-100">
                    {displayQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                    className="h-7 w-7 rounded-full text-slate-300 transition hover:bg-slate-800"
                    aria-label="Aumentar cantidad"
                    disabled={isOutOfStock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button size="lg" disabled={isOutOfStock}>
                  {isOutOfStock ? "No disponible" : "Agregar al carrito"}
                </Button>
                <Button size="lg" variant="outline" disabled={isOutOfStock}>
                  Comprar ahora
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">
                Checkout y carrito en proceso. Esta vista ya deja preparada la seleccion de variante.
              </p>
            </div>
          </section>

          <section className="soft-card p-4 md:p-5">
            <h2 className="section-title text-slate-100">Compra con confianza</h2>
            <div className="mt-3 grid gap-2">
              <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
                <BadgeCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
                <div>
                  <p className="font-semibold text-slate-100">Producto original y verificado</p>
                  <p className="text-xs text-slate-400">Validamos lote y estado antes del despacho.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
                <RotateCcw className="mt-0.5 h-4 w-4 text-amber-300" />
                <div>
                  <p className="font-semibold text-slate-100">Cambios y devoluciones</p>
                  <p className="text-xs text-slate-400">Gestion simple dentro del plazo de politica vigente.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <article className="soft-card p-4 md:p-5">
          <h2 className="section-title text-slate-100">Descripcion detallada</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{product.description}</p>

          <div className="mt-4 grid gap-2">
            <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/55 p-3 text-sm text-slate-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              <span>Variantes configurables para elegir la combinacion correcta en una sola ficha.</span>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/55 p-3 text-sm text-slate-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              <span>Precio y stock se actualizan segun la variante elegida.</span>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/55 p-3 text-sm text-slate-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              <span>Estructura lista para conectar con checkout real y metodos de pago.</span>
            </div>
          </div>
        </article>

        <aside className="soft-card p-4 md:p-5">
          <h2 className="section-title text-slate-100">Ficha rapida</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <dt className="text-slate-400">Marca</dt>
              <dd className="font-semibold text-slate-100">{product.brand || "Niez Store"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <dt className="text-slate-400">Categoria</dt>
              <dd className="font-semibold text-slate-100">{categoryName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <dt className="text-slate-400">Variante activa</dt>
              <dd className="font-semibold text-slate-100">{selectedVariantSummary || "Unica"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <dt className="text-slate-400">SKU</dt>
              <dd className="font-semibold text-slate-100">{selectedVariant?.sku || "No definido"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <dt className="text-slate-400">Stock</dt>
              <dd className="font-semibold text-slate-100">{stock}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">Variantes totales</dt>
              <dd className="font-semibold text-slate-100">{effectiveVariants.length}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="soft-card p-4 md:p-5">
          <h2 className="section-title text-slate-100">Que incluye tu compra</h2>
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
                Si el pedido aun no se despacho, podemos ajustar color o capacidad segun stock.
              </p>
            </details>
            <details className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
              <summary className="cursor-pointer font-semibold text-slate-100">
                La garantia aplica a todas las variantes?
              </summary>
              <p className="mt-2 text-xs text-slate-400">
                Si, la garantia se mantiene sin importar la variante elegida del mismo producto.
              </p>
            </details>
          </div>
        </article>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="soft-card p-4 md:p-5">
          <h2 className="section-title text-slate-100">Tambien te puede interesar</h2>
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
