import PageShell from "../ui/page-shell";
import SectionCard from "../ui/section-card";
import AdminStats from "./AdminStats";

export default function AdminLayout({
  stats,
  error,
  tabs = [],
  activeTab,
  onTabChange,
  children,
}) {
  return (
    <PageShell gap="sm">
      <AdminStats stats={stats} />

      {error ? <div className="admin-alert-error">{error}</div> : null}

      <SectionCard className="p-2" bodyClassName="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange?.(tab.id)}
            className={`admin-tab px-3 py-2 text-left text-xs transition md:min-w-[180px] ${
              activeTab === tab.id ? "admin-tab--active" : ""
            }`}
          >
            <span className="block text-sm font-semibold">{tab.title}</span>
            <span className="mt-0.5 block text-[11px] admin-subtitle">{tab.description}</span>
          </button>
        ))}
      </SectionCard>

      {children}
    </PageShell>
  );
}
