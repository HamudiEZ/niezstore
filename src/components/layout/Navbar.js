"use client";

import {
  Heart,
  Menu,
  Moon,
  Search,
  ShoppingCart,
  Sun,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/categorias", label: "Categorias" },
  { href: "/ofertas", label: "Ofertas" },
  { href: "/cuenta", label: "Cuenta" },
  { href: "/admin", label: "Admin" },
];

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem("theme") === "light" ? "light" : "dark";
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-light", theme === "light");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
      <div className="w-full px-4 py-3 md:px-8 lg:px-10">
        <div className="relative flex items-center gap-3 md:justify-between">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-200 md:hidden"
            aria-label="Abrir menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400 text-xs font-bold text-slate-950">
              NS
            </span>
            <span className="text-base font-extrabold tracking-tight text-slate-100 md:text-lg">
              Niez Store
            </span>
          </Link>

          <div className="relative hidden md:absolute md:left-1/2 md:block md:w-[min(45vw,620px)] md:-translate-x-1/2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar productos"
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            />
          </div>

          <div className="ml-auto flex items-center gap-1 text-slate-300 md:ml-0 md:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 hover:bg-slate-800"
              aria-label="Cambiar tema"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <Link
              href="/favoritos"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 hover:bg-slate-800"
              aria-label="Favoritos"
            >
              <Heart className="h-4 w-4" />
            </Link>
            <Link
              href="/carrito"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 hover:bg-slate-800"
              aria-label="Carrito"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                3
              </span>
            </Link>
            <Link
              href="/login"
              className="hidden h-10 items-center gap-1 rounded-full border border-slate-700 px-3 text-xs font-semibold hover:bg-slate-800 md:inline-flex"
            >
              <User className="h-4 w-4" /> Ingresar
            </Link>
          </div>
        </div>

        <div className="mt-3 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar productos"
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            />
          </div>
        </div>

        <nav className="mt-3 hidden items-center gap-5 border-t border-slate-800 pt-3 text-sm font-medium text-slate-300 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-cyan-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {open && (
          <nav className="mt-3 grid gap-1 rounded-xl border border-slate-700 bg-slate-900/90 p-2 text-sm font-medium text-slate-200 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 hover:bg-slate-800"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
