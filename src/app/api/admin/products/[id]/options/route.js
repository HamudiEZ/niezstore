import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { INPUT_LIMITS } from "@/lib/input-limits";

export async function POST(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resolvedParams = await params;
  const productId = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
  if (!productId) {
    return NextResponse.json({ error: "ID de producto requerido." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const positionRaw = body.position;
  const position =
    positionRaw === "" || positionRaw == null ? 0 : Number(positionRaw);
  const values = Array.isArray(body.values) ? body.values : [];

  if (!name) {
    return NextResponse.json({ error: "Nombre de opcion requerido." }, { status: 400 });
  }
  if (name.length > INPUT_LIMITS.optionName) {
    return NextResponse.json(
      { error: `Nombre de opcion demasiado largo (max ${INPUT_LIMITS.optionName}).` },
      { status: 400 }
    );
  }
  if (!Number.isFinite(position) || position < 0 || position > INPUT_LIMITS.optionPositionMax) {
    return NextResponse.json(
      { error: `Posicion invalida (0 a ${INPUT_LIMITS.optionPositionMax}).` },
      { status: 400 }
    );
  }

  const normalizedValues = values
    .map((value, index) => ({
      value: String(value ?? "").trim(),
      position: index,
    }))
    .filter((entry) => entry.value.length > 0);
  const hasTooLongValue = normalizedValues.some(
    (entry) => entry.value.length > INPUT_LIMITS.optionValue
  );
  if (hasTooLongValue) {
    return NextResponse.json(
      { error: `Cada valor debe tener maximo ${INPUT_LIMITS.optionValue} caracteres.` },
      { status: 400 }
    );
  }

  const uniqueValues = [];
  const valueSet = new Set();
  for (const entry of normalizedValues) {
    const key = entry.value.toLowerCase();
    if (valueSet.has(key)) continue;
    valueSet.add(key);
    uniqueValues.push(entry);
  }

  const result = await prisma.$transaction(async (tx) => {
    const option = await tx.productOption.create({
      data: {
        name,
        position,
        productId,
        values: {
          create: uniqueValues,
        },
      },
      include: { values: true },
    });

    const deactivated = await tx.productVariant.updateMany({
      where: {
        productId,
        isActive: true,
        optionSignature: "",
      },
      data: { isActive: false },
    });

    return { option, deactivatedBaseVariants: deactivated.count };
  });

  return NextResponse.json(result);
}
