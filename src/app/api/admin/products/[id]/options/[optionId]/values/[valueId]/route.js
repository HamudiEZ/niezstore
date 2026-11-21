import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { INPUT_LIMITS } from "@/lib/input-limits";

class ValueConflictError extends Error {
  constructor(message, status = 409) {
    super(message);
    this.status = status;
  }
}

export async function PUT(request, { params }) {
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
    const optionId =
      typeof resolvedParams?.optionId === "string"
        ? resolvedParams.optionId.trim()
        : "";
    const valueId =
      typeof resolvedParams?.valueId === "string"
        ? resolvedParams.valueId.trim()
        : "";

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
      return NextResponse.json(
        { error: "Opcion no encontrada." },
        { status: 404 }
      );
    }

    const existingValue = option.values.find((entry) => entry.id === valueId);
    if (!existingValue) {
      return NextResponse.json(
        { error: "Valor no encontrado." },
        { status: 404 }
      );
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
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
      (typeof positionRaw === "boolean" ||
        !Number.isInteger(position) ||
        position < 0 ||
        position > INPUT_LIMITS.optionPositionMax)
    ) {
      return NextResponse.json(
        {
          error: `Posicion de valor invalida (entero de 0 a ${INPUT_LIMITS.optionPositionMax}).`,
        },
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
  } catch (error) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Valor no encontrado." },
        { status: 404 }
      );
    }
    console.error("Admin Product Option Value PUT Error:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar valor." },
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
    const optionId =
      typeof resolvedParams?.optionId === "string"
        ? resolvedParams.optionId.trim()
        : "";
    const valueId =
      typeof resolvedParams?.valueId === "string"
        ? resolvedParams.valueId.trim()
        : "";

    if (!productId || !optionId || !valueId) {
      return NextResponse.json(
        { error: "ID de producto, opcion y valor requeridos." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const value = await tx.productOptionValue.findFirst({
        where: {
          id: valueId,
          optionId,
          option: { productId },
        },
        select: { id: true },
      });

      if (!value) {
        throw new ValueConflictError("Valor no encontrado.", 404);
      }

      const usedCount = await tx.variantOption.count({
        where: {
          optionValueId: valueId,
          variant: { productId },
        },
      });

      if (usedCount > 0) {
        throw new ValueConflictError(
          "No puedes eliminar este valor porque esta siendo usado por variantes.",
          409
        );
      }

      await tx.productOptionValue.delete({ where: { id: valueId } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ValueConflictError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Admin Product Option Value DELETE Error:", error);
    return NextResponse.json(
      { error: "Error interno al eliminar valor." },
      { status: 500 }
    );
  }
}
