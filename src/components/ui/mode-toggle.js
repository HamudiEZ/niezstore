"use client";

import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const DEFAULT_THEME = "dark";

export default function ModeToggle({ className = "" }) {
  const { resolvedTheme, setTheme } = useTheme();
  
  // Prevent hydration mismatch
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const activeTheme = mounted ? resolvedTheme || DEFAULT_THEME : DEFAULT_THEME;
  const isDark = activeTheme === "dark";

  return (
    <button
      type="button"
      className={clsx(
        "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-700 hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 overflow-hidden",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Cambiar tema"
    >
      <div 
        className={clsx(
          "absolute transition-all duration-500 ease-in-out",
          isDark ? "translate-y-0 rotate-0 opacity-100" : "-translate-y-8 rotate-90 opacity-0"
        )}
      >
        <Moon className="h-5 w-5 text-slate-300" />
      </div>
      <div 
        className={clsx(
          "absolute transition-all duration-500 ease-in-out",
          !isDark ? "translate-y-0 rotate-0 opacity-100" : "translate-y-8 -rotate-90 opacity-0"
        )}
      >
        <Sun className="h-5 w-5 text-slate-800 dark:text-slate-800" />
      </div>
    </button>
  );
}
