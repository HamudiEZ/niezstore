"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ModeToggle from "./mode-toggle";

export default function AuthTopBar() {
  return (
    <header className="soft-card px-4 py-3 md:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400 text-xs font-bold text-slate-950">
            NS
          </span>
          <span className="text-sm font-extrabold tracking-tight page-title md:text-base">
            Niez Store
          </span>
        </Link>

        <nav className="flex items-center gap-2 text-xs">
          <ModeToggle />
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-3 py-1.5 font-semibold text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a la tienda
          </Link>
        </nav>
      </div>
    </header>
  );
}
