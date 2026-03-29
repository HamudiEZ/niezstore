import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

function buildOptionSignature(optionValueIds) {
  const ids = Array.isArray(optionValueIds) ? optionValueIds.map(String) : [];
  return ids.sort().join("-");
}

function parseP2002Target(error) {
  const target = error?.meta?.target;
  if (Array.isArray(target)) return target;
  if (typeof target === "string") return [target];
  return [];
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
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
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

  try {
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

      // If product is configurable, disable orphan "base" variants.
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

    return NextResponse.json({ variant });
  } catch (error) {
    if (error?.code === "P2002") {
      const target = parseP2002Target(error);
      if (target.includes("sku")) {
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
    throw error;
  }
}
