import Link from "next/link";
import { Button } from "../../components/ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-6">
      <section className="soft-card w-full max-w-md p-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">Iniciar sesion</h1>
        <p className="mt-1 text-sm text-slate-400">Accede a tus pedidos y direcciones guardadas.</p>

        <form className="mt-4 space-y-3">
          <input type="email" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100" placeholder="Correo electronico" />
          <input type="password" className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100" placeholder="Contrasena" />
          <Button className="w-full" size="lg" type="submit">Entrar</Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          No tienes cuenta? <Link href="/register" className="font-semibold text-cyan-300 hover:underline">Registrate</Link>
        </p>
      </section>
    </div>
  );
}
