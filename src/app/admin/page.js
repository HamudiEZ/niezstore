import { redirect } from "next/navigation";
import AdminPanel from "../../components/admin/AdminPanel";
import { getCurrentUser } from "@/lib/auth";
import PageShell from "@/components/ui/page-shell";
import PageHeader from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin | Niez Store",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/cuenta");

  return (
    <PageShell gap="sm">
      <PageHeader
        eyebrow="Panel interno"
        title="Admin Dashboard"
        description="Gestiona Resumen, Categorías, Productos y Ventas en módulos separados. Los cambios se guardan en la base de datos."
        eyebrowClassName="admin-subtitle"
        titleClassName="admin-title"
        descriptionClassName="admin-subtitle"
      />
      <AdminPanel />
    </PageShell>
  );
}
