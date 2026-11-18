"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import AuthPanel from "../../components/ui/auth-panel";
import PageShell from "../../components/ui/page-shell";
import AuthTopBar from "../../components/ui/auth-topbar";
import AuthTrustPanel from "../../components/ui/auth-trust-panel";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <PageShell gap="sm" className="mx-auto w-full max-w-5xl py-1">
      <AuthTopBar />
      <section className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_420px]">
        <AuthTrustPanel />
        <AuthPanel
          className="mx-auto lg:ml-auto lg:mr-0"
          title="Recuperar contraseña"
          description="Ingresa tu correo para recibir asistencia con el restablecimiento de tu acceso."
          footer={
            <>
              ¿Recordaste tu contraseña?{" "}
              <Link href="/login" className="font-semibold text-cyan-300 hover:underline">
                Inicia sesión
              </Link>
            </>
          }
        >
          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-[var(--foreground)]">
                Recibimos tu solicitud para <strong className="font-semibold">{email.trim()}</strong>. El restablecimiento automático por correo estará disponible próximamente; mientras tanto, contactá a soporte oficial con tu correo registrado para recuperar el acceso.
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }}
              >
                Intentar con otro correo
              </Button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="form-input"
                placeholder="Correo electrónico"
                required
              />
              <Button className="w-full" size="lg" type="submit">
                Enviar instrucciones
              </Button>
            </form>
          )}
        </AuthPanel>
      </section>
    </PageShell>
  );
}
