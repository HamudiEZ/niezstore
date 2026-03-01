import Link from "next/link";
import { Button } from "../../components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-6">
      <section className="soft-card w-full max-w-md p-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
          Recuperar contrasena
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Ingresa tu correo y te enviaremos instrucciones para restablecer tu
          acceso.
        </p>

        <form className="mt-4 space-y-3">
          <input
            type="email"
            className="form-input"
            placeholder="Correo electronico"
            required
          />
          <Button className="w-full" size="lg" type="submit">
            Enviar instrucciones
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          Recordaste tu contrasena?{" "}
          <Link href="/login" className="font-semibold text-cyan-300 hover:underline">
            Inicia sesion
          </Link>
        </p>
      </section>
    </div>
  );
}
