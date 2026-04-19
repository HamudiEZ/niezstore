"use client";

import clsx from "clsx";

/**
 * Shared quantity control component used in both the cart and product detail pages.
 *
 * Props:
 *  - value       {number|string}  Current quantity value
 *  - onChange    {function}       Called with the new numeric value
 *  - min         {number}         Minimum allowed value (default: 1)
 *  - max         {number}         Maximum allowed value (default: 99)
 *  - disabled    {boolean}        Disables all controls
 *  - allowInput  {boolean}        Shows an editable text input instead of a plain span
 *  - className   {string}         Extra classes for the wrapper
 */
export default function QuantityControl({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  allowInput = false,
  size = "sm",
  className,
}) {
  const parsed = parseInt(value, 10);
  const numVal = isNaN(parsed) ? min : parsed;

  const handleDecrement = () => {
    onChange(Math.max(min, numVal - 1));
  };

  const handleIncrement = () => {
    onChange(Math.min(max, numVal + 1));
  };

  // Base and variance classes
  const smWrapperClass = "flex h-10 w-max items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1";
  const mdWrapperClass = "flex h-12 w-full sm:w-[140px] items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1";

  const smBtnClass = "flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] disabled:opacity-40 disabled:cursor-not-allowed font-medium select-none";
  const mdBtnClass = "flex h-full w-10 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] disabled:opacity-40 disabled:cursor-not-allowed font-medium select-none";

  const wrapperClass = size === "md" ? mdWrapperClass : smWrapperClass;
  const btnClass = size === "md" ? mdBtnClass : smBtnClass;
  
  const inputClass = size === "md" ? "w-12" : "w-10";
  const spanClass = size === "md" ? "w-10" : "w-8";

  return (
    <div className={clsx(wrapperClass, className)}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || numVal <= min}
        className={btnClass}
        aria-label="Disminuir cantidad"
      >
        −
      </button>

      {allowInput ? (
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "" || /^\d+$/.test(val)) onChange(val);
          }}
          onBlur={(e) => {
            let val = parseInt(e.target.value, 10);
            if (isNaN(val) || val < min) val = min;
            if (val > max) val = max;
            onChange(val);
          }}
          disabled={disabled}
          className={clsx(inputClass, "bg-transparent text-center text-sm font-bold text-[var(--foreground)] outline-none disabled:opacity-50")}
          aria-label="Cantidad"
        />
      ) : (
        <span className={clsx(spanClass, "text-center text-sm font-bold text-[var(--foreground)]")}>
          {numVal}
        </span>
      )}

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || numVal >= max}
        className={btnClass}
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  );
}
