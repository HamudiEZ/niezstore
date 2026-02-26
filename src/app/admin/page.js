import AdminPanel from "../../components/admin/AdminPanel";

export const metadata = {
  title: "Admin | Niez Store",
};

export default function AdminPage() {
  return (
    <div className="space-y-4">
      <header className="soft-card p-4 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Panel interno</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-100">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">
          Gestiona productos y operaciones desde una sola vista. Esta fase es UI-only, sin persistencia en base de datos.
        </p>
      </header>

      <AdminPanel />
    </div>
  );
}
