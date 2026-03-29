import PageHeader from "../../components/ui/page-header";
import PageShell from "../../components/ui/page-shell";
import SectionCard from "../../components/ui/section-card";

export default function FavoritesPage() {
  return (
    <PageShell>
      <PageHeader
        title="Favoritos"
        description="Guarda productos para revisarlos rapido cuando quieras."
      />
      <SectionCard className="p-6 text-sm page-subtitle">
        Aun no tienes productos guardados como favoritos.
      </SectionCard>
    </PageShell>
  );
}
