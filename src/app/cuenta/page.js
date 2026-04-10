import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/page-header";
import PageShell from "@/components/ui/page-shell";
import AccountClient from "@/components/account/AccountClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Mi Cuenta | Niez Store",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/cuenta");
  }

  // Fetch orders from DB securely on the server
  const dbOrders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize orders to plain objects (Next.js Client Components don't support Prisma Decimal objects)
  const orders = dbOrders.map(order => ({
    ...order,
    subtotalAmount: Number(order.subtotalAmount),
    shippingAmount: Number(order.shippingAmount),
    totalAmount: Number(order.totalAmount),
    discountAmount: Number(order.discountAmount),
    taxAmount: Number(order.taxAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      discountTotal: Number(item.discountTotal),
      createdAt: item.createdAt.toISOString(),
    }))
  }));

  return (
    <PageShell>
      <PageHeader 
        title="Mi cuenta" 
        description="Gestioná perfil, pedidos, direcciones y seguridad de tu cuenta Niez." 
      />
      
      {/* Client layout for tab management */}
      <AccountClient user={user} orders={orders} />
    </PageShell>
  );
}
