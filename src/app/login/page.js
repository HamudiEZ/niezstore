"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthPanel from "../../components/ui/auth-panel";
import AuthTopBar from "../../components/ui/auth-topbar";
import AuthTrustPanel from "../../components/ui/auth-trust-panel";
import { Button } from "../../components/ui/button";
import PageShell from "../../components/ui/page-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "No se pudo iniciar sesión.");
        return;
      }

      const search =
        typeof window !== "undefined" ? window.location.search : "";
      const nextPath = new URLSearchParams(search).get("next") || "/";
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell gap="sm" className="mx-auto w-full max-w-5xl py-1">
      <AuthTopBar />
      <section className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_420px]">
        <AuthTrustPanel />
        <AuthPanel
          className="mx-auto lg:ml-auto lg:mr-0"
          title="Iniciar sesión"
          description="Accede a tus pedidos y direcciones guardadas."
          footer={
            <>
              ¿No tienes cuenta?{" "}
              <Link
                href="/register"
                className="font-semibold text-cyan-300 hover:underline"
              >
                Regístrate
              </Link>
            </>
          }
        >
          <form className="space-y-3" onSubmit={handleSubmit}>
            <input
              type="email"
              className="form-input"
              placeholder="Correo electrónico"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input form-input-with-icon"
                placeholder="Contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={
                  showPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-cyan-300 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </AuthPanel>
      </section>
    </PageShell>
  );
}
