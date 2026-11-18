import clsx from "clsx";

const BASE =
  "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 disabled:pointer-events-none disabled:opacity-60 cursor-pointer active:scale-95";

const VARIANTS = {
  default: "btn-ui btn-ui--primary",
  outline: "btn-ui btn-ui--outline",
  ghost: "btn-ui btn-ui--ghost",
};

const SIZES = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-11 px-5 text-sm",
};

export function getButtonClass({ variant = "default", size = "md", className } = {}) {
  return clsx(BASE, VARIANTS[variant], SIZES[size], className);
}

export function Button({ className, variant = "default", size = "md", ...props }) {
  return (
    <button
      className={getButtonClass({ variant, size, className })}
      {...props}
    />
  );
}
