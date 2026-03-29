import Link from "next/link";
import { Button } from "../../components/ui/button";
import PageHeader from "../../components/ui/page-header";
import PageShell from "../../components/ui/page-shell";
import SectionCard from "../../components/ui/section-card";

export default function CartPage() {
  return (
    <PageShell>
      <PageHeader
        title="Carrito"
        description="Revisa tus productos seleccionados antes de pasar al checkout."
      />

      <SectionCard className="p-6 text-sm page-subtitle">
        Tu carrito esta vacio por ahora.
        <div className="mt-4">
          <Link href="/categorias">
            <Button size="lg">Explorar productos</Button>
          </Link>
        </div>
      </SectionCard>
    </PageShell>
  );
}
