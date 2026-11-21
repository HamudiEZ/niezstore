import Link from "next/link";
import Logo from "../ui/Logo";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-800 bg-slate-950/75 backdrop-blur">
      <div className="mx-auto grid w-full max-w-[1400px] gap-8 px-4 py-8 md:grid-cols-4 md:px-8 lg:px-10">
        <div className="md:col-span-2">
          <Logo size="md" />
          <p className="mt-3 max-w-md text-sm text-slate-400">
            Ecommerce demo para comprar tecnologia, hogar, moda y mas desde un
            solo lugar.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">Ayuda</p>
          <div className="mt-2 grid gap-2 text-sm text-slate-400">
            <Link href="/checkout" className="hover:text-cyan-300">
              Metodos de pago
            </Link>
            <Link href="/carrito" className="hover:text-cyan-300">
              Envio y devoluciones
            </Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">Explorar</p>
          <div className="mt-2 grid gap-2 text-sm text-slate-400">
            <Link href="/ofertas" className="hover:text-cyan-300">
              Ofertas
            </Link>
            <Link href="/categorias" className="hover:text-cyan-300">
              Categorias
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="flex w-full flex-col gap-2 px-4 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between md:px-8 lg:px-10">
          <span>© {new Date().getFullYear()} Niez Store. Todos los derechos reservados.</span>
          <span>Compra segura | Envio confiable | Soporte 24/7</span>
        </div>
      </div>
    </footer>
  );
}
