import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/cuenta");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
        Mi cuenta
      </h1>

      <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="soft-card p-4">
          <ul className="space-y-2 text-sm">
            <li className="rounded-lg bg-cyan-400 px-3 py-2 font-semibold text-slate-950">
              Perfil
            </li>
            <li className="rounded-lg px-3 py-2 text-slate-300">Pedidos</li>
            <li className="rounded-lg px-3 py-2 text-slate-300">Direcciones</li>
            <li className="rounded-lg px-3 py-2 text-slate-300">Seguridad</li>
          </ul>
        </aside>

        <section className="soft-card p-4 md:p-5">
          <h2 className="text-lg font-bold text-slate-100">
            Informacion personal
          </h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>
              <span className="text-slate-400">Nombre: </span>
              {user.fullName}
            </p>
            <p>
              <span className="text-slate-400">Correo: </span>
              {user.email}
            </p>
            <p>
              <span className="text-slate-400">Rol: </span>
              {user.role}
            </p>
          </div>

          <div className="mt-5 notice-muted">
            Aun no tienes pedidos registrados.{" "}
            <Link href="/" className="font-semibold text-cyan-300 hover:underline">
              Explorar productos
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
