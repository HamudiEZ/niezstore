"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldCheck, Truck, Zap } from "lucide-react";

export default function HeroBanner({ deals = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!deals.length) return undefined;
    const timer = setInterval(() => {
      setIndex((previous) => (previous + 1) % deals.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [deals.length]);

  if (!deals.length) return null;

  const deal = deals[index];
  const titleLines = deal.title.split("\n");
  const ctaStyles = {
    "combo-perifericos-pro": {
      primary: "bg-cyan-300 text-slate-950 hover:bg-cyan-200",
      secondary: "hero-cta-secondary",
    },
    "setup-laptop-ultra": {
      primary: "bg-amber-300 text-slate-950 hover:bg-amber-200",
      secondary: "hero-cta-secondary text-amber-50",
    },
    "smart-tv-cine": {
      primary: "bg-rose-300 text-slate-950 hover:bg-rose-200",
      secondary: "hero-cta-secondary text-rose-50",
    },
  };
  const tone = ctaStyles[deal.id] ?? {
    primary: "bg-cyan-300 text-slate-950 hover:bg-cyan-200",
    secondary: "hero-cta-secondary",
  };

  const goToPrevious = () => {
    setIndex((previous) => (previous - 1 + deals.length) % deals.length);
  };

  const goToNext = () => {
    setIndex((previous) => (previous + 1) % deals.length);
  };

  return (
    <section className="overflow-hidden border-y border-slate-800">
      <div className="relative min-h-[360px] md:min-h-[500px]">
        <Image
          src={deal.backgroundUrl}
          alt={deal.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1200px"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-teal-900/80 via-cyan-900/65 to-slate-900/75" />

        <div className="relative z-10 min-h-[360px] px-4 py-8 md:min-h-[500px] md:px-8 lg:px-10">
          <div className="mx-auto grid min-h-[360px] w-full max-w-[1240px] items-center gap-8 md:min-h-[500px] md:grid-cols-[1fr_1fr]">
            <div className="animate-[heroAppear_0.6s_ease-out] text-white">
            <span className="inline-flex items-center rounded-full bg-white/18 px-3 py-1 text-xs font-semibold backdrop-blur">
              {deal.badge}
            </span>

            <h1 className="mt-4 text-4xl font-extrabold leading-[0.98] tracking-tight md:text-6xl">
              {titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>

            <p className="mt-3 max-w-lg text-sm text-white/90 md:text-base">{deal.subtitle}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/categoria/${deal.categorySlug ?? deal.categoryId}`}
                className={`inline-flex min-h-11 items-center rounded-lg px-5 text-sm font-semibold shadow-lg transition-colors duration-300 ${tone.primary}`}
              >
                {deal.ctaPrimary}
              </Link>
              <Link
                href="/ofertas"
                className={`inline-flex min-h-11 items-center rounded-lg border border-white/20 px-5 text-sm font-semibold shadow-lg transition-colors duration-300 ${tone.secondary}`}
              >
                {deal.ctaSecondary}
              </Link>
            </div>

            <div className="mt-6 grid max-w-xl grid-cols-1 gap-2 text-xs sm:grid-cols-3">
              <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2.5 py-2 backdrop-blur">
                <Truck className="h-3.5 w-3.5" /> Envio rapido
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2.5 py-2 backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5" /> Compra segura
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2.5 py-2 backdrop-blur">
                <Zap className="h-3.5 w-3.5" /> Ofertas diarias
              </span>
            </div>
            </div>

            <div className="hidden md:flex md:justify-end">
              <div className="relative w-[440px]">
                <div className="relative h-72 overflow-hidden rounded-2xl border border-white/35 bg-white/20 p-3 shadow-2xl backdrop-blur-sm">
                  <div className="relative h-full w-full overflow-hidden rounded-xl bg-white">
                    <Image
                      src={deal.imageUrl}
                      alt={deal.title}
                      fill
                      className="object-cover"
                      sizes="350px"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:hidden">
              <div className="relative h-32 overflow-hidden rounded-xl border border-white/35 bg-white/20 p-2 backdrop-blur-sm">
                <div className="relative h-full w-full overflow-hidden rounded-lg bg-white">
                  <Image
                    src={deal.imageUrl}
                    alt={deal.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 350px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={goToPrevious}
          className="absolute left-3 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-900 shadow hover:bg-white"
          aria-label="Slide anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={goToNext}
          className="absolute right-3 top-1/2 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-900 shadow hover:bg-white"
          aria-label="Slide siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
          {deals.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(itemIndex)}
              className={`h-2 rounded-full transition-all ${
                itemIndex === index ? "w-7 bg-white" : "w-2 bg-white/55"
              }`}
              aria-label={`Ir al slide ${itemIndex + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
