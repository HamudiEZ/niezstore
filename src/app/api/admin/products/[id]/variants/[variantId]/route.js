import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { INPUT_LIMITS } from "@/lib/input-limits";

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
  const data = {};

  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "Estado invalido." }, { status: 400 });
    }
    data.isActive = body.isActive;
  }

  if (Object.prototype.hasOwnProperty.call(body, "price")) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0 || price > INPUT_LIMITS.priceMax) {
      return NextResponse.json({ error: "Precio invalido." }, { status: 400 });
    }
    data.price = price;
  }

  if (Object.prototype.hasOwnProperty.call(body, "stock")) {
    const stock = Number(body.stock);
    if (!Number.isFinite(stock) || stock < 0 || stock > INPUT_LIMITS.stockMax) {
      return NextResponse.json({ error: "Stock invalido." }, { status: 400 });
    }
    data.stock = stock;
  }

  if (Object.prototype.hasOwnProperty.call(body, "sku")) {
    const nextSku = String(body.sku ?? "").trim() || null;
    if (nextSku && nextSku.length > INPUT_LIMITS.sku) {
      return NextResponse.json(
        { error: `SKU demasiado largo (max ${INPUT_LIMITS.sku}).` },
        { status: 400 }
      );
    }
    data.sku = nextSku;
  }

  if (Object.prototype.hasOwnProperty.call(body, "compareAtPrice")) {
    const compareAtPrice =
      body.compareAtPrice === "" || body.compareAtPrice == null
        ? null
        : Number(body.compareAtPrice);

    if (
      compareAtPrice != null &&
      (!Number.isFinite(compareAtPrice) ||
        compareAtPrice <= 0 ||
        compareAtPrice > INPUT_LIMITS.priceMax)
    ) {
      return NextResponse.json(
        { error: "Precio comparativo invalido." },
        { status: 400 }
      );
    }

    data.compareAtPrice = compareAtPrice;
  }

  if (Object.prototype.hasOwnProperty.call(body, "imageUrl")) {
    const nextImageUrl = String(body.imageUrl ?? "").trim() || null;
    if (nextImageUrl && nextImageUrl.length > INPUT_LIMITS.imageUrl) {
      return NextResponse.json(
        { error: `URL de imagen demasiado larga (max ${INPUT_LIMITS.imageUrl}).` },
        { status: 400 }
      );
    }
    data.imageUrl = nextImageUrl;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No hay campos para actualizar." },
      { status: 400 }
    );
  }

  const existing = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
    include: {
      variantOptions: {
        include: {
          optionValue: {
            select: { optionId: true },
          },
        },
      },
      product: {
        select: {
          options: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Variante no encontrada." },
      { status: 404 }
    );
  }

  const optionCount = existing.product?.options?.length ?? 0;
  const mappedOptionIds = new Set(
    (existing.variantOptions ?? [])
      .map((entry) => entry.optionValue?.optionId)
      .filter(Boolean)
  );
  const isIncompleteForConfigurable =
    optionCount > 0 && mappedOptionIds.size !== optionCount;

  if (isIncompleteForConfigurable && data.isActive === true) {
    return NextResponse.json(
      {
        error:
          "Esta variante no tiene todos los valores de opcion. No puede activarse.",
      },
      { status: 400 }
    );
  }

  try {
    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data,
    });

    return NextResponse.json({ variant });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una variante con ese SKU." },
        { status: 409 }
      );
    }
    throw error;
  }
}
