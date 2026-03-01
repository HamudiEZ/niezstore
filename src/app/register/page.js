"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/ui/button";

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
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
    <div className="flex min-h-[70vh] items-center justify-center py-6">
      <section className="soft-card w-full max-w-md p-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
          Crear cuenta
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Compra mas rapido y guarda tus favoritos.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <input
            className="form-input"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
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
              aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="form-input form-input-with-icon"
              placeholder="Confirmar contrasena"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={showConfirmPassword ? "Ocultar contrasena confirmada" : "Mostrar contrasena confirmada"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <Button className="w-full" size="lg" type="submit" disabled={loading}>
            {loading ? "Creando..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold text-cyan-300 hover:underline">
            Inicia sesion
          </Link>
        </p>
      </section>
    </div>
  );
}
