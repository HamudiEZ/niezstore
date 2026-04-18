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
import PasswordStrengthMeter from "../../components/ui/password-strength-meter";
import {
  MIN_PASSWORD_LENGTH,
  validatePasswordStrength,
} from "../../lib/password-policy";

function getStrengthState(password, checksPassed) {
  if (!password) {
    return { label: "Sin evaluar", tone: "idle" };
  }
  if (checksPassed <= 4) {
    return { label: "Débil", tone: "weak" };
  }
  if (checksPassed <= 6) {
    return { label: "Media", tone: "medium" };
  }
  return { label: "Fuerte", tone: "strong" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordValidation = validatePasswordStrength(password, {
    email,
    fullName,
  });
  const checks = Object.values(passwordValidation.checks);
  const totalChecks = checks.length || 1;
  const passedChecks = checks.filter(Boolean).length;
  const strengthPercent = password
    ? Math.round((passedChecks / totalChecks) * 100)
    : 0;
  const strength = getStrengthState(password, passedChecks);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "No se pudo crear la cuenta.");
        return;
      }

      router.replace("/cuenta");
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
          title="Crear cuenta"
          description="Compra más rápido y guarda tus favoritos."
          footer={
            <>
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
                className="font-semibold text-cyan-300 hover:underline"
              >
                Inicia sesión
              </Link>
            </>
          }
        >
          <form className="space-y-3" onSubmit={handleSubmit}>
            <input
              className="form-input"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              required
            />

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
                autoComplete="new-password"
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

            <PasswordStrengthMeter
              label={strength.label}
              tone={strength.tone}
              percent={strengthPercent}
              hint={`Usa ${MIN_PASSWORD_LENGTH}+ caracteres con mayúscula, minúscula, número y símbolo.`}
              feedback={
                password && !passwordValidation.isValid
                  ? passwordValidation.errors[0]
                  : ""
              }
            />

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-input form-input-with-icon"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={
                  showConfirmPassword
                    ? "Ocultar contraseña confirmada"
                    : "Mostrar contraseña confirmada"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear cuenta"}
            </Button>
          </form>
        </AuthPanel>
      </section>
    </PageShell>
  );
}
