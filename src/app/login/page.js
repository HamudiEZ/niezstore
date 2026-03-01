"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "../../components/ui/button";

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
        setError(payload.error || "No se pudo iniciar sesion.");
        return;
      }

      const search =
        typeof window !== "undefined" ? window.location.search : "";
      const nextPath = new URLSearchParams(search).get("next") || "/cuenta";
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center py-6">
      <section className="soft-card w-full max-w-md p-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
          Iniciar sesion
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Accede a tus pedidos y direcciones guardadas.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <input
            type="email"
            className="form-input"
            placeholder="Correo electronico"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="form-input form-input-with-icon"
              placeholder="Contrasena"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={
                showPassword ? "Ocultar contrasena" : "Mostrar contrasena"
              }
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-cyan-300 hover:underline"
            >
              Olvide mi contrasena
            </Link>
          </div>
          <Button className="w-full" size="lg" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-semibold text-cyan-300 hover:underline"
          >
            Registrate
          </Link>
        </p>
      </section>
    </div>
  );
}
