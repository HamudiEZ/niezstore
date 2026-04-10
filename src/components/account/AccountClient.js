"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AccountSidebar from "./AccountSidebar";
import AccountProfile from "./AccountProfile";
import AccountOrders from "./AccountOrders";
import AccountAddresses from "./AccountAddresses";
import AccountSecurity from "./AccountSecurity";

export default function AccountClient({ user, orders }) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["profile", "orders", "addresses", "security"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <AccountProfile user={user} />;
      case "orders":
        return <AccountOrders orders={orders} />;
      case "addresses":
        return <AccountAddresses />;
      case "security":
        return <AccountSecurity />;
      default:
        return <AccountProfile user={user} />;
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr] mt-8">
      {/* Sidebar Navigation */}
      <div className="space-y-4">
        <AccountSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content Area */}
      <div className="min-w-0 transition-all duration-300 transform">
        {renderContent()}
      </div>
    </div>
  );
}
