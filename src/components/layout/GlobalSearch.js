"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

export default function GlobalSearch({ className }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Debouncer
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Fetch suggestions
  useEffect(() => {
    let active = true;

    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await res.json();
        if (active) {
          setSuggestions(data.results || []);
        }
      } catch (error) {
        console.error("Search error", error);
      } finally {
        if (active) setIsSearching(false);
      }
    };

    fetchSuggestions();

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (query.trim().length > 0) {
      setIsOpen(false);
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className={clsx("relative w-full", className)}>
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar productos"
          className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/50 pl-10 pr-10 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-cyan-400 focus:bg-[var(--surface)] shadow-sm dark:shadow-none"
          autoComplete="off"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
          </div>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[100] w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl backdrop-blur-xl">
          <ul className="flex flex-col py-2">
            {suggestions.length > 0 ? (
              suggestions.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/producto/${product.slug || product.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--surface-soft)] transition"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--surface-soft)]">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <Search className="m-auto h-4 w-4 text-[var(--muted)] mt-3" />
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-sm font-medium text-[var(--foreground)]">
                        {product.name}
                      </span>
                      {product.brand && (
                        <span className="text-xs text-[var(--muted)]">{product.brand}</span>
                      )}
                    </div>
                    <span className="ml-auto text-sm font-bold text-cyan-400 shrink-0">
                      ${product.price}
                    </span>
                  </Link>
                </li>
              ))
            ) : (
              !isSearching && (
                <li className="px-4 py-3 text-sm text-[var(--muted)] font-medium">
                  No encontramos productos para "{query}"
                </li>
              )
            )}
          </ul>
          
          {/* Exact search sentence option as requested */}
          <div className="border-t border-[var(--border)] bg-[var(--surface-soft)]/30 p-2">
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-[var(--surface-soft)] transition"
            >
              <Search className="h-4 w-4" />
              <span>Buscar exactamente "{query}"</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
