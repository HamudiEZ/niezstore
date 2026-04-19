"use client";

import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore, useState, useCallback } from "react";

const DEFAULT_THEME = "dark";

export default function ModeToggle({ className = "" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [animating, setAnimating] = useState(false);

  // Prevent hydration mismatch
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const activeTheme = mounted ? resolvedTheme || DEFAULT_THEME : DEFAULT_THEME;
  const isDark = activeTheme === "dark";

  // Play exit animation first, then switch theme
  const handleToggle = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setTheme(isDark ? "light" : "dark");
      setAnimating(false);
    }, 250);
  }, [animating, isDark, setTheme]);

  // During animation: the exiting icon should start leaving
  const moonVisible = animating ? !isDark : isDark;
  const sunVisible  = animating ? isDark  : !isDark;

  return (
    <button
      type="button"
      className={clsx(
        "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 overflow-hidden cursor-pointer",
        className
      )}
      onClick={handleToggle}
      aria-label="Cambiar tema"
    >
      {/* Moon — visible in dark mode */}
      <div
        className={clsx(
          "absolute transition-all duration-300 ease-in-out",
          moonVisible
            ? "translate-y-0 rotate-0 opacity-100"
            : "-translate-y-8 rotate-90 opacity-0"
        )}
      >
        <Moon className="h-5 w-5 text-slate-300" />
      </div>

      {/* Sun — visible in light mode */}
      <div
        className={clsx(
          "absolute transition-all duration-300 ease-in-out",
          sunVisible
            ? "translate-y-0 rotate-0 opacity-100"
            : "translate-y-8 -rotate-90 opacity-0"
        )}
      >
        <Sun className="h-5 w-5 text-slate-800" />
      </div>
    </button>
  );
}
