import Link from "next/link";

export default function Logo({ className = "", iconOnly = false, size = "md" }) {
  const sizeMap = {
    sm: { icon: "h-7 w-7", text: "text-sm", sub: "text-[9px]" },
    md: { icon: "h-9 w-9", text: "text-lg", sub: "text-[10px]" },
    lg: { icon: "h-11 w-11", text: "text-xl", sub: "text-xs" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-3 transition-transform duration-200 active:scale-95 ${className}`.trim()}
      aria-label="Niez Store - Inicio"
    >
      {/* Isotipo SVG de Niez Store: Diseño moderno, limpio y geométrico */}
      <div className={`relative flex shrink-0 items-center justify-center rounded-xl p-1 bg-gradient-to-tr from-cyan-500 via-sky-500 to-indigo-600 shadow-[0_2px_10px_rgba(6,182,212,0.3)] transition-all duration-300 group-hover:shadow-[0_2px_16px_rgba(6,182,212,0.5)] ${currentSize.icon}`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
          aria-hidden="true"
        >
          {/* Símbolo N estilizado en trazo limpio y profesional */}
          <path
            d="M 8 23 V 9 L 24 23 V 9"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Acento moderno en vértice superior derecho */}
          <circle cx="24" cy="9" r="1.8" fill="#38bdf8" />
        </svg>
      </div>

      {/* Logotipo Tipográfico */}
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-tight text-slate-100 group-hover:text-cyan-300 transition-colors duration-200 ${currentSize.text}`}>
            NIEZ<span className="text-cyan-400 font-extrabold ml-1">STORE</span>
          </span>
          <span className={`font-bold tracking-widest uppercase text-slate-400 mt-0.5 ${currentSize.sub}`}>
            PARAGUAY
          </span>
        </div>
      )}
    </Link>
  );
}
