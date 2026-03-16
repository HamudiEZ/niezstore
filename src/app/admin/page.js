import { redirect } from "next/navigation";
import AdminPanel from "../../components/admin/AdminPanel";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
  title: "Admin | Niez Store",
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/cuenta");

  return (
    <div className="space-y-4">
      <header className="soft-card p-4 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
          Panel interno
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-100">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Gestiona catalogo, opciones y variantes desde una sola vista. Los
          cambios se guardan en la base de datos.
        </p>
      </header>

      <AdminPanel />
    </div>
  );
}
