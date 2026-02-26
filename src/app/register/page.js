import Link from "next/link";
import { Button } from "../../components/ui/button";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-6">
      <section className="soft-card w-full max-w-md p-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Crear cuenta</h1>
        <p className="mt-1 text-sm text-slate-400">Compra mas rapido y guarda tus favoritos.</p>

        <form className="mt-4 space-y-3">
          <input className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100" placeholder="Nombre completo" />
          <input type="email" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100" placeholder="Correo electronico" />
          <input type="password" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100" placeholder="Contrasena" />
          <Button className="w-full" size="lg" type="submit">Crear cuenta</Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          Ya tienes cuenta? <Link href="/login" className="font-semibold text-cyan-300 hover:underline">Inicia sesion</Link>
        </p>
      </section>
    </div>
  );
}
