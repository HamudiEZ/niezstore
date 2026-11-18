import { Suspense } from "react";
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
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/cuenta");
  }

  const safeUser = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    phone: user.phone ?? "",
  };

  // Fetch orders from DB securely on the server
  const dbOrders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variant: {
            select: {
              id: true,
              sku: true,
              variantOptions: {
                include: {
                  optionValue: {
                    include: {
                      option: {
                        select: {
                          name: true,
                          position: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize orders to plain objects (Next.js Client Components don't support Prisma Decimal objects)
  const orders = dbOrders.map((order) => ({
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    currency: order.currency,
    subtotalAmount: Number(order.subtotalAmount),
    shippingAmount: Number(order.shippingAmount),
    totalAmount: Number(order.totalAmount),
    discountAmount: Number(order.discountAmount),
    taxAmount: Number(order.taxAmount),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => {
      const variantSummary = (item.variant?.variantOptions || [])
        .slice()
        .sort(
          (a, b) =>
            (a.optionValue?.option?.position ?? 0) -
            (b.optionValue?.option?.position ?? 0)
        )
        .map(
          (vo) =>
            vo.optionValue?.option?.name && vo.optionValue?.value
              ? `${vo.optionValue.option.name}: ${vo.optionValue.value}`
              : null
        )
        .filter(Boolean)
        .join(" | ");

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        discountTotal: Number(item.discountTotal),
        createdAt: item.createdAt.toISOString(),
        product: item.product,
        variantSku: item.variant?.sku ?? null,
        variantSummary: variantSummary || null,
      };
    }),
  }));

  return (
    <PageShell>
      <PageHeader
        title="Mi cuenta"
        description="Gestioná perfil, pedidos, direcciones y seguridad de tu cuenta Niez."
      />

      <Suspense
        fallback={
          <div className="py-12 text-center text-sm text-[var(--muted)]">
            Cargando cuenta...
          </div>
        }
      >
        <AccountClient user={safeUser} orders={orders} />
      </Suspense>
    </PageShell>
  );
}
