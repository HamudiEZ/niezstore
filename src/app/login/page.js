"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AuthPanel from "../../components/ui/auth-panel";
import AuthTopBar from "../../components/ui/auth-topbar";
import AuthTrustPanel from "../../components/ui/auth-trust-panel";
import { Button } from "../../components/ui/button";
import PageShell from "../../components/ui/page-shell";
import { useAuthStore } from "@/store/authStore";

function getSafeNextPath(rawNext, fallback = "/") {
  if (
    typeof rawNext === "string" &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.includes("\\")
  ) {
    return rawNext;
  }
  return fallback;
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const safeNext = getSafeNextPath(rawNext, "/");
  const registerHref =
    safeNext !== "/" ? `/register?next=${encodeURIComponent(safeNext)}` : "/register";

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

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "No se pudo iniciar sesión.");
        return;
      }

      if (payload.user) {
        useAuthStore.getState().setUser(payload.user);
      }

      router.replace(safeNext);
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPanel
      className="mx-auto lg:ml-auto lg:mr-0"
      title="Iniciar sesión"
      description="Accede a tus pedidos y direcciones guardadas."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link
            href={registerHref}
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
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
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
  );
}

export default function LoginPage() {
  return (
    <PageShell gap="sm" className="mx-auto w-full max-w-5xl py-1">
      <AuthTopBar />
      <section className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_420px]">
        <AuthTrustPanel />
        <Suspense
          fallback={
            <AuthPanel
              className="mx-auto lg:ml-auto lg:mr-0"
              title="Iniciar sesión"
              description="Cargando..."
            >
              <div className="py-8 text-center text-sm text-[var(--muted)]">
                Cargando...
              </div>
            </AuthPanel>
          }
        >
          <LoginFormContent />
        </Suspense>
      </section>
    </PageShell>
  );
}
