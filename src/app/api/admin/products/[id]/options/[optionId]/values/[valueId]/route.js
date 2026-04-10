import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { INPUT_LIMITS } from "@/lib/input-limits";

export async function PUT(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resolvedParams = await params;
  const productId = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
  const optionId =
    typeof resolvedParams?.optionId === "string" ? resolvedParams.optionId : "";
  const valueId =
    typeof resolvedParams?.valueId === "string" ? resolvedParams.valueId : "";

  if (!productId || !optionId || !valueId) {
    return NextResponse.json(
      { error: "ID de producto, opcion y valor requeridos." },
      { status: 400 }
    );
  }

  const option = await prisma.productOption.findFirst({
    where: { id: optionId, productId },
    include: { values: true },
  });
  if (!option) {
    return NextResponse.json({ error: "Opcion no encontrada." }, { status: 404 });
  }

  const existingValue = option.values.find((entry) => entry.id === valueId);
  if (!existingValue) {
    return NextResponse.json({ error: "Valor no encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const value = String(body.value ?? "").trim();
  const positionRaw = body.position;
  const position =
    positionRaw === "" || positionRaw == null ? null : Number(positionRaw);

  if (!value) {
    return NextResponse.json({ error: "Valor requerido." }, { status: 400 });
  }
  if (value.length > INPUT_LIMITS.optionValue) {
    return NextResponse.json(
      { error: `Valor demasiado largo (max ${INPUT_LIMITS.optionValue}).` },
      { status: 400 }
    );
  }

  if (
    position != null &&
    (!Number.isFinite(position) ||
      position < 0 ||
      position > INPUT_LIMITS.optionPositionMax)
  ) {
    return NextResponse.json(
      { error: `Posicion de valor invalida (0 a ${INPUT_LIMITS.optionPositionMax}).` },
      { status: 400 }
    );
  }

  const duplicated = option.values.some(
    (entry) =>
      entry.id !== valueId && entry.value.toLowerCase() === value.toLowerCase()
  );
  if (duplicated) {
    return NextResponse.json(
      { error: "Ese valor ya existe en la opcion." },
      { status: 409 }
    );
  }

  const updated = await prisma.productOptionValue.update({
    where: { id: valueId },
    data: {
      value,
      ...(position != null ? { position } : {}),
    },
  });

  return NextResponse.json({ value: updated });
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resolvedParams = await params;
  const productId = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
  const optionId =
    typeof resolvedParams?.optionId === "string" ? resolvedParams.optionId : "";
  const valueId =
    typeof resolvedParams?.valueId === "string" ? resolvedParams.valueId : "";

  if (!productId || !optionId || !valueId) {
    return NextResponse.json(
      { error: "ID de producto, opcion y valor requeridos." },
      { status: 400 }
    );
  }

  const value = await prisma.productOptionValue.findFirst({
    where: {
      id: valueId,
      optionId,
      option: { productId },
    },
    select: { id: true },
  });

  if (!value) {
    return NextResponse.json({ error: "Valor no encontrado." }, { status: 404 });
  }

  const usedCount = await prisma.variantOption.count({
    where: {
      optionValueId: valueId,
      variant: { productId },
    },
  });

  if (usedCount > 0) {
    return NextResponse.json(
      {
        error:
          "No puedes eliminar este valor porque esta siendo usado por variantes.",
      },
      { status: 409 }
    );
  }

  await prisma.productOptionValue.delete({ where: { id: valueId } });
  return NextResponse.json({ ok: true });
}
