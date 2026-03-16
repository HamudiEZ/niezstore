import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

function buildOptionSignature(optionValueIds) {
  const ids = Array.isArray(optionValueIds) ? optionValueIds.map(String) : [];
  return ids.sort().join("-");
}

export async function POST(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resolvedParams = await params;
  const productId = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
  if (!productId) {
    return NextResponse.json(
      { error: "ID de producto requerido." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const sku = String(body.sku ?? "").trim() || null;
  const price = Number(body.price ?? 0);
  const compareAtPrice =
    body.compareAtPrice === "" || body.compareAtPrice == null
      ? null
      : Number(body.compareAtPrice);
  const stock = Number(body.stock ?? 0);
  const imageUrl = String(body.imageUrl ?? "").trim() || null;
  const isActive = body.isActive !== false;
  const optionValueIds = Array.isArray(body.optionValueIds)
    ? body.optionValueIds.map(String)
    : [];

  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "Precio invalido." }, { status: 400 });
  }

  if (!Number.isFinite(stock) || stock < 0) {
    return NextResponse.json({ error: "Stock invalido." }, { status: 400 });
  }

  const optionSignature = buildOptionSignature(optionValueIds);

  try {
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku,
        price,
        compareAtPrice,
        stock,
        imageUrl,
        isActive,
        optionSignature,
        variantOptions: {
          create: optionValueIds.map((optionValueId) => ({
            optionValueId,
          })),
        },
      },
      include: { variantOptions: true },
    });

    return NextResponse.json({ variant });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una variante con esa combinacion." },
        { status: 409 }
      );
    }
    throw error;
  }
}
