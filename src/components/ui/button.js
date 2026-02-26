import clsx from "clsx";

export function Button({ className, variant = "default", size = "md", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 disabled:pointer-events-none disabled:opacity-60";

  const variants = {
    default: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
    outline: "border border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800",
    ghost: "text-slate-200 hover:bg-slate-800",
  };

  const sizes = {
    sm: "min-h-9 px-3 text-xs",
    md: "min-h-10 px-4 text-sm",
    lg: "min-h-11 px-5 text-sm",
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
