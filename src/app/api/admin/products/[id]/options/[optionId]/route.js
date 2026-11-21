import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { INPUT_LIMITS } from "@/lib/input-limits";

class OptionConflictError extends Error {
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

    if (!productId || !optionId) {
      return NextResponse.json(
        { error: "ID de producto y opcion requeridos." },
        { status: 400 }
      );
    }

    const option = await prisma.productOption.findFirst({
      where: { id: optionId, productId },
      select: { id: true },
    });
    if (!option) {
      return NextResponse.json(
        { error: "Opcion no encontrada." },
        { status: 404 }
      );
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const name = String(body.name ?? "").trim();
    const positionRaw = body.position;
    const position =
      positionRaw === "" || positionRaw == null ? null : Number(positionRaw);

    if (!name) {
      return NextResponse.json(
        { error: "Nombre de opcion requerido." },
        { status: 400 }
      );
    }
    if (name.length > INPUT_LIMITS.optionName) {
      return NextResponse.json(
        {
          error: `Nombre de opcion demasiado largo (max ${INPUT_LIMITS.optionName}).`,
        },
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
          error: `Posicion de opcion invalida (entero de 0 a ${INPUT_LIMITS.optionPositionMax}).`,
        },
        { status: 400 }
      );
    }

    const duplicate = await prisma.productOption.findFirst({
      where: {
        productId,
        id: { not: optionId },
        name: { equals: name, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "Ya existe otra opcion con ese nombre." },
        { status: 409 }
      );
    }

    const updated = await prisma.productOption.update({
      where: { id: optionId },
      data: {
        name,
        ...(position != null ? { position } : {}),
      },
      include: { values: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json({ option: updated });
  } catch (error) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Opcion no encontrada." },
        { status: 404 }
      );
    }
    console.error("Admin Product Option PUT Error:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar opcion." },
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

    if (!productId || !optionId) {
      return NextResponse.json(
        { error: "ID de producto y opcion requeridos." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const option = await tx.productOption.findFirst({
        where: { id: optionId, productId },
        select: { id: true },
      });
      if (!option) {
        throw new OptionConflictError("Opcion no encontrada.", 404);
      }

      const usedCount = await tx.variantOption.count({
        where: {
          optionValue: { optionId },
          variant: { productId },
        },
      });

      if (usedCount > 0) {
        throw new OptionConflictError(
          "No puedes eliminar esta opcion porque esta siendo usada por variantes.",
          409
        );
      }

      await tx.productOption.delete({ where: { id: optionId } });

      // If no options remain, re-enable an existing base variant if none are active
      const remainingOptions = await tx.productOption.count({
        where: { productId },
      });
      if (remainingOptions === 0) {
        const activeCount = await tx.productVariant.count({
          where: { productId, isActive: true },
        });
        if (activeCount === 0) {
          await tx.productVariant.updateMany({
            where: { productId, optionSignature: "" },
            data: { isActive: true },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof OptionConflictError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Admin Product Option DELETE Error:", error);
    return NextResponse.json(
      { error: "Error interno al eliminar opcion." },
      { status: 500 }
    );
  }
}
