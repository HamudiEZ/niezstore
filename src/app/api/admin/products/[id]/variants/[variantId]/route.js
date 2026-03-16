import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resolvedParams = await params;
  const productId = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
  const variantId =
    typeof resolvedParams?.variantId === "string" ? resolvedParams.variantId : "";

  if (!productId || !variantId) {
    return NextResponse.json(
      { error: "ID de producto y variante requeridos." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.isActive !== "boolean") {
    return NextResponse.json(
      { error: "Estado invalido." },
      { status: 400 }
    );
  }

  const existing = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Variante no encontrada." },
      { status: 404 }
    );
  }

  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: { isActive: body.isActive },
  });

  return NextResponse.json({ variant });
}
