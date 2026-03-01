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
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/categorias", label: "Categorias" },
  { href: "/ofertas", label: "Ofertas" },
  { href: "/cuenta", label: "Cuenta" },
];

function getInitialTheme() {
  return window.localStorage.getItem("theme") === "light" ? "light" : "dark";
}

function getInitialFromUser(user) {
  const source = user?.fullName?.trim() || user?.email || "U";
  return source.charAt(0).toUpperCase();
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const accountMenuRef = useRef(null);
  const themeHydratedRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      const savedTheme = getInitialTheme();
      themeHydratedRef.current = true;
      setTheme(savedTheme);
      document.documentElement.classList.toggle("theme-light", savedTheme === "light");
    });

    return () => window.cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (!themeHydratedRef.current) return;
    document.documentElement.classList.toggle("theme-light", theme === "light");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let active = true;
    const loadMe = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const payload = await response.json();
        if (active) setUser(payload.user ?? null);
      } catch {
        if (active) setUser(null);
      }
    };

    loadMe();
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!accountMenuRef.current) return;
      if (accountMenuRef.current.contains(event.target)) return;
      setAccountOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const visibleNavItems = useMemo(
    () =>
      navItems.filter((item) => {
        if (!item.adminOnly) return true;
        return user?.role === "ADMIN";
      }),
    [user]
  );

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAccountOpen(false);
    setOpen(false);
    router.replace("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
      <div className="w-full px-4 py-3 md:px-8 lg:px-10">
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-200 md:hidden"
            aria-label="Abrir menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400 text-xs font-bold text-slate-950">
              NS
            </span>
            <span className="text-base font-extrabold tracking-tight text-slate-100 md:text-lg">
              Niez Store
            </span>
          </Link>

          <div className="hidden min-w-0 md:flex md:flex-1 md:justify-center md:px-4 lg:px-6">
            <div className="relative w-full max-w-[620px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar productos"
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900/70 pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 text-slate-300 md:ml-0 md:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 hover:bg-slate-800 nav-hover"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 hover:bg-slate-800 nav-hover"
              aria-label="Favoritos"
            >
              <Heart className="h-4 w-4" />
            </Link>
            <Link
              href="/carrito"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 hover:bg-slate-800 nav-hover"
              aria-label="Carrito"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                3
              </span>
            </Link>

            {user ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-bold text-cyan-300 hover:bg-slate-800 nav-hover"
                  onClick={() => setAccountOpen((current) => !current)}
                  aria-label="Menu de cuenta"
                >
                  {getInitialFromUser(user)}
                </button>

                {accountOpen && (
                  <div className="absolute right-0 top-12 z-50 w-52 rounded-xl border border-slate-700 bg-slate-900/95 p-2 shadow-xl">
                    <p className="px-3 pb-2 pt-1 text-xs text-slate-400">
                      {user.fullName}
                    </p>
                    <Link
                      href="/cuenta"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 nav-hover"
                      onClick={() => setAccountOpen(false)}
                    >
                      Mi cuenta
                    </Link>
                    <Link
                      href="/cuenta"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 nav-hover"
                      onClick={() => setAccountOpen(false)}
                    >
                      Mis pedidos
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 nav-hover"
                        onClick={() => setAccountOpen(false)}
                      >
                        Panel admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-slate-800 nav-hover"
                    >
                      Cerrar sesion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-10 items-center gap-1 rounded-full border border-slate-700 px-3 text-xs font-semibold hover:bg-slate-800 nav-hover"
              >
                <User className="h-4 w-4" />
                <span className="hidden md:inline">Ingresar</span>
              </Link>
            )}
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
          {visibleNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-cyan-300 nav-link-hover">
              {item.label}
            </Link>
          ))}
        </nav>

        {open && (
          <nav className="mt-3 grid gap-1 rounded-xl border border-slate-700 bg-slate-900/90 p-2 text-sm font-medium text-slate-200 md:hidden">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 hover:bg-slate-800 nav-hover"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/cuenta"
                  className="rounded-lg px-3 py-2 hover:bg-slate-800 nav-hover"
                  onClick={() => setOpen(false)}
                >
                  Mi cuenta
                </Link>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-rose-300 hover:bg-slate-800 nav-hover"
                  onClick={handleLogout}
                >
                  Cerrar sesion
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 hover:bg-slate-800 nav-hover"
                onClick={() => setOpen(false)}
              >
                Ingresar
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

