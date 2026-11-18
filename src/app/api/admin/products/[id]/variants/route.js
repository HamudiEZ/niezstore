import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  isValidAllowedImageUrl,
  parseJsonBody,
  verifySameOrigin,
} from "@/lib/api-security";
import { INPUT_LIMITS } from "@/lib/input-limits";

function buildOptionSignature(optionValueIds) {
  const ids = Array.isArray(optionValueIds) ? optionValueIds.map(String) : [];
  return ids.sort().join("-");
}

function isSkuUniqueError(error) {
  const targets = [];
  const metaTarget = error?.meta?.target;
  if (Array.isArray(metaTarget)) targets.push(...metaTarget);
  else if (typeof metaTarget === "string") targets.push(metaTarget);

  const driverFields =
    error?.meta?.driverAdapterError?.cause?.constraint?.fields ||
    error?.cause?.constraint?.fields;
  if (Array.isArray(driverFields)) targets.push(...driverFields);

  const combined = [...targets, error?.message || ""].join(" ").toLowerCase();
  return combined.includes("sku");
}

function parseNonBooleanNumber(raw) {
  if (raw === "" || raw == null || typeof raw === "boolean") return NaN;
  return Number(raw);
}

export async function POST(request, { params }) {
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
    if (!productId) {
      return NextResponse.json(
        { error: "ID de producto requerido." },
        { status: 400 }
      );
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const sku = String(body.sku ?? "").trim() || null;
    const price = parseNonBooleanNumber(body.price);
    const compareAtPrice =
      body.compareAtPrice === "" || body.compareAtPrice == null
        ? null
        : parseNonBooleanNumber(body.compareAtPrice);
    const stock =
      body.stock === "" || body.stock == null
        ? 0
        : parseNonBooleanNumber(body.stock);
    const imageUrl = String(body.imageUrl ?? "").trim() || null;
    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;
    const optionValueIds = Array.isArray(body.optionValueIds)
      ? body.optionValueIds.map(String)
      : [];

    if (!Number.isFinite(price) || price <= 0 || price > INPUT_LIMITS.priceMax) {
      return NextResponse.json({ error: "Precio invalido." }, { status: 400 });
    }
    if (
      compareAtPrice != null &&
      (!Number.isFinite(compareAtPrice) ||
        compareAtPrice <= price ||
        compareAtPrice > INPUT_LIMITS.priceMax)
    ) {
      return NextResponse.json(
        {
          error:
            "El precio anterior debe ser numerico y mayor al precio actual.",
        },
        { status: 400 }
      );
    }

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
    if (sku && sku.length > INPUT_LIMITS.sku) {
      return NextResponse.json(
        { error: `SKU demasiado largo (max ${INPUT_LIMITS.sku}).` },
        { status: 400 }
      );
    }
    if (imageUrl && !isValidAllowedImageUrl(imageUrl)) {
      return NextResponse.json(
        { error: "URL de imagen no permitida. Usa HTTPS de Cloudinary o Unsplash." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        options: {
          select: {
            id: true,
            values: { select: { id: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 }
      );
    }

    const options = product.options ?? [];
    const optionCount = options.length;

    if (optionCount === 0 && optionValueIds.length > 0) {
      return NextResponse.json(
        { error: "Este producto no tiene opciones configuradas." },
        { status: 400 }
      );
    }

    let normalizedOptionValueIds = [];
    if (optionCount > 0) {
      if (optionValueIds.length !== optionCount) {
        return NextResponse.json(
          { error: "Debes seleccionar un valor para cada opcion." },
          { status: 400 }
        );
      }

      const valueToOption = new Map();
      options.forEach((option) => {
        option.values.forEach((value) => {
          valueToOption.set(value.id, option.id);
        });
      });

      const uniqueValueIds = new Set(optionValueIds);
      if (uniqueValueIds.size !== optionValueIds.length) {
        return NextResponse.json(
          { error: "No puedes repetir valores en una variante." },
          { status: 400 }
        );
      }

      const selectedOptionIds = new Set();
      for (const valueId of uniqueValueIds) {
        const optionId = valueToOption.get(valueId);
        if (!optionId) {
          return NextResponse.json(
            { error: "Hay valores de opcion invalidos para este producto." },
            { status: 400 }
          );
        }
        selectedOptionIds.add(optionId);
      }

      if (selectedOptionIds.size !== optionCount) {
        return NextResponse.json(
          { error: "Debes seleccionar un valor unico por cada opcion." },
          { status: 400 }
        );
      }

      normalizedOptionValueIds = [...uniqueValueIds];
    }

    const optionSignature = buildOptionSignature(normalizedOptionValueIds);

    const variant = await prisma.$transaction(async (tx) => {
      const created = await tx.productVariant.create({
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
            create: normalizedOptionValueIds.map((optionValueId) => ({
              optionValueId,
            })),
          },
        },
        include: { variantOptions: true },
      });

      if (optionCount > 0) {
        await tx.productVariant.updateMany({
          where: {
            productId,
            isActive: true,
            optionSignature: "",
            id: { not: created.id },
          },
          data: { isActive: false },
        });
      }

      return created;
    });

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      if (isSkuUniqueError(error)) {
        return NextResponse.json(
          { error: "Ya existe una variante con ese SKU." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Ya existe una variante con esa combinacion." },
        { status: 409 }
      );
    }
    console.error("Admin Variants POST Error:", error);
    return NextResponse.json(
      { error: "Error interno al crear variante." },
      { status: 500 }
    );
  }
}
