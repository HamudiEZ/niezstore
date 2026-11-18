"use client";

import { useRouter } from "next/navigation";
import SectionCard from "@/components/ui/section-card";
import { User, Package, MapPin, ShieldCheck, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const MENU_ITEMS = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "orders", label: "Pedidos", icon: Package },
  { id: "addresses", label: "Direcciones", icon: MapPin },
  { id: "security", label: "Seguridad", icon: ShieldCheck },
];

export default function AccountSidebar({ activeTab, onTabChange }) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
    router.refresh();
  };

  return (
    <SectionCard className="p-2 overflow-hidden" bodyClassName="flex flex-col gap-1">
      {MENU_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            type="button"
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition font-bold ${
              isActive
                ? "bg-[var(--accent)] text-[var(--background)] shadow-xl shadow-[var(--accent)]/30"
                : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? "text-[var(--background)]" : "text-[var(--muted)]"}`} />
            {item.label}
          </button>
        );
      })}

      <div className="my-2 border-t border-[var(--border)] mx-2" />

      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-[var(--admin-danger)] hover:bg-[var(--admin-danger)]/10 transition shadow-sm active:scale-95"
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesión
      </button>
    </SectionCard>
  );
}
