"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Generic reusable carousel component.
 *
 * Props:
 *  - children: React nodes to render as slides (each direct child = 1 slide)
 *  - scrollCount: how many items to scroll per arrow click (default 2)
 *  - className: extra class on the outer wrapper
 */
export default function Carousel({ children, scrollCount = 2, className = "" }) {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [dotCount, setDotCount] = useState(1);
  const [activeDot, setActiveDot] = useState(0);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) {
      setCanLeft(false);
      setCanRight(false);
      setHasOverflow(false);
      setDotCount(1);
      setActiveDot(0);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const overflow = maxScroll > 8;

    setHasOverflow(overflow);
    setCanLeft(overflow && scrollLeft > 6);
    setCanRight(overflow && scrollLeft < maxScroll - 6);

    if (!overflow) {
      setDotCount(1);
      setActiveDot(0);
      return;
    }

    const pages = Math.min(8, Math.max(2, Math.ceil(scrollWidth / clientWidth)));
    setDotCount(pages);
    const progress = maxScroll <= 0 ? 0 : scrollLeft / maxScroll;
    setActiveDot(Math.min(pages - 1, Math.round(progress * (pages - 1))));
  }, []);

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update, children]);

  const scrollByDirection = (dir) => {
    const el = trackRef.current;
    if (!el) return;

    const items = el.children;
    if (!items.length) return;

    const firstItem = items[0];
    const secondItem = items[1];
    let itemStep;

    if (secondItem) {
      itemStep = secondItem.getBoundingClientRect().left - firstItem.getBoundingClientRect().left;
    } else {
      itemStep = firstItem.getBoundingClientRect().width;
    }

    const delta = itemStep * scrollCount;
    el.scrollBy({ left: dir * delta, behavior: "smooth" });
  };

  const goToDot = (index) => {
    const el = trackRef.current;
    if (!el || dotCount <= 1) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const target = (index / Math.max(1, dotCount - 1)) * maxScroll;
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  return (
    <div className={className}>
      <div className="relative overflow-hidden">
        {canLeft ? (
          <button
            type="button"
            onClick={() => scrollByDirection(-1)}
            className="product-carousel__arrow product-carousel__arrow--left"
            aria-label="Ver anteriores"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
        ) : null}

        <div
          ref={trackRef}
          onScroll={update}
          className="flex items-stretch gap-[var(--shop-card-gap)] overflow-x-auto scroll-smooth pb-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          tabIndex={0}
          role="region"
          aria-label="Carrusel"
        >
          {children}
        </div>

        {canRight ? (
          <button
            type="button"
            onClick={() => scrollByDirection(1)}
            className="product-carousel__arrow product-carousel__arrow--right"
            aria-label="Ver más"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {hasOverflow ? (
        <div className="mt-3 flex justify-center gap-1.5">
          {Array.from({ length: dotCount }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToDot(i)}
              className={`h-2 rounded-full transition-all ${
                i === activeDot
                  ? "w-7 bg-cyan-400"
                  : "w-2 bg-slate-500/60"
              }`}
              aria-label={`Ir a posición ${i + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
