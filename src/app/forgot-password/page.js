import Link from "next/link";
import { Button } from "../../components/ui/button";
import AuthPanel from "../../components/ui/auth-panel";
import PageShell from "../../components/ui/page-shell";
import AuthTopBar from "../../components/ui/auth-topbar";
import AuthTrustPanel from "../../components/ui/auth-trust-panel";

export default function ForgotPasswordPage() {
  return (
    <PageShell gap="sm" className="mx-auto w-full max-w-5xl py-1">
      <AuthTopBar />
      <section className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_420px]">
        <AuthTrustPanel />
        <AuthPanel
          className="mx-auto lg:ml-auto lg:mr-0"
          title="Recuperar contrasena"
          description="Ingresa tu correo y te enviaremos instrucciones para restablecer tu acceso."
          footer={
            <>
              Recordaste tu contrasena?{" "}
              <Link href="/login" className="font-semibold text-cyan-300 hover:underline">
                Inicia sesion
              </Link>
            </>
          }
        >
          <form className="space-y-3">
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
        </AuthPanel>
      </section>
    </PageShell>
  );
}
