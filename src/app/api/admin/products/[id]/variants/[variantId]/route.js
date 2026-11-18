import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  isValidAllowedImageUrl,
  parseJsonBody,
  verifySameOrigin,
} from "@/lib/api-security";
import { INPUT_LIMITS } from "@/lib/input-limits";

function parseNonBooleanNumber(raw) {
  if (raw === "" || raw == null || typeof raw === "boolean") return NaN;
  return Number(raw);
}

export async function PATCH(request, { params }) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const resolvedParams = await params;
    const productId =
      typeof resolvedParams?.id === "string" ? resolvedParams.id.trim() : "";
    const variantId =
      typeof resolvedParams?.variantId === "string"
        ? resolvedParams.variantId.trim()
        : "";

    if (!productId || !variantId) {
      return NextResponse.json(
        { error: "ID de producto y variante requeridos." },
        { status: 400 }
      );
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const data = {};

    if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json({ error: "Estado invalido." }, { status: 400 });
      }
      data.isActive = body.isActive;
    }

    if (Object.prototype.hasOwnProperty.call(body, "price")) {
      const price = parseNonBooleanNumber(body.price);
      if (
        !Number.isFinite(price) ||
        price <= 0 ||
        price > INPUT_LIMITS.priceMax
      ) {
        return NextResponse.json({ error: "Precio invalido." }, { status: 400 });
      }
      data.price = price;
    }

    if (Object.prototype.hasOwnProperty.call(body, "stock")) {
      const stock = parseNonBooleanNumber(body.stock);
      if (
        !Number.isInteger(stock) ||
        stock < 0 ||
        stock > INPUT_LIMITS.stockMax
      ) {
        return NextResponse.json(
          { error: "Stock invalido (debe ser entero >= 0)." },
          { status: 400 }
        );
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
          : parseNonBooleanNumber(body.compareAtPrice);

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
      if (nextImageUrl && !isValidAllowedImageUrl(nextImageUrl)) {
        return NextResponse.json(
          { error: "URL de imagen no permitida. Usa HTTPS de Cloudinary o Unsplash." },
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

    const effectivePrice =
      data.price !== undefined ? data.price : Number(existing.price);
    const effectiveCompareAt =
      data.compareAtPrice !== undefined
        ? data.compareAtPrice
        : existing.compareAtPrice != null
          ? Number(existing.compareAtPrice)
          : null;

    if (
      data.compareAtPrice !== undefined &&
      effectiveCompareAt != null &&
      effectiveCompareAt <= effectivePrice
    ) {
      return NextResponse.json(
        {
          error:
            "El precio anterior debe ser mayor al precio actual.",
        },
        { status: 400 }
      );
    }

    if (
      data.price !== undefined &&
      data.compareAtPrice === undefined &&
      effectiveCompareAt != null &&
      effectiveCompareAt <= effectivePrice
    ) {
      data.compareAtPrice = null;
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
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Variante no encontrada." },
        { status: 404 }
      );
    }
    console.error("Admin Variant PATCH Error:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar variante." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const resolvedParams = await params;
    const productId =
      typeof resolvedParams?.id === "string" ? resolvedParams.id.trim() : "";
    const variantId =
      typeof resolvedParams?.variantId === "string"
        ? resolvedParams.variantId.trim()
        : "";

    if (!productId || !variantId) {
      return NextResponse.json(
        { error: "ID de producto y variante requeridos." },
        { status: 400 }
      );
    }

    const existing = await prisma.productVariant.findFirst({
      where: { id: variantId, productId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Variante no encontrada." },
        { status: 404 }
      );
    }

    const orderItemCount = await prisma.orderItem.count({
      where: { variantId },
    });
    if (orderItemCount > 0) {
      return NextResponse.json(
        {
          error:
            "No puedes eliminar esta variante porque tiene pedidos asociados. Desactivala en su lugar.",
        },
        { status: 409 }
      );
    }

    await prisma.productVariant.delete({ where: { id: variantId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "No puedes eliminar esta variante porque tiene registros asociados.",
        },
        { status: 409 }
      );
    }
    console.error("Admin Variant DELETE Error:", error);
    return NextResponse.json(
      { error: "Error interno al eliminar variante." },
      { status: 500 }
    );
  }
}
