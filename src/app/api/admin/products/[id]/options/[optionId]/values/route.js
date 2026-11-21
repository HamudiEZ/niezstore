import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { INPUT_LIMITS } from "@/lib/input-limits";

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
      include: { values: true },
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
    const value = String(body.value ?? "").trim();
    const maxPos = option.values.reduce(
      (max, entry) => Math.max(max, entry.position ?? 0),
      -1
    );
    const positionRaw = body.position;
    const position =
      positionRaw === "" || positionRaw == null
        ? Math.min(INPUT_LIMITS.optionPositionMax, maxPos + 1)
        : Number(positionRaw);

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
      typeof positionRaw === "boolean" ||
      !Number.isInteger(position) ||
      position < 0 ||
      position > INPUT_LIMITS.optionPositionMax
    ) {
      return NextResponse.json(
        {
          error: `Posicion de valor invalida (entero de 0 a ${INPUT_LIMITS.optionPositionMax}).`,
        },
        { status: 400 }
      );
    }

    const duplicated = option.values.some(
      (entry) => entry.value.toLowerCase() === value.toLowerCase()
    );
    if (duplicated) {
      return NextResponse.json(
        { error: "Ese valor ya existe en la opcion." },
        { status: 409 }
      );
    }

    const created = await prisma.productOptionValue.create({
      data: {
        optionId,
        value,
        position,
      },
    });

    return NextResponse.json({ value: created }, { status: 201 });
  } catch (error) {
    console.error("Admin Product Option Value POST Error:", error);
    return NextResponse.json(
      { error: "Error interno al crear valor." },
      { status: 500 }
    );
  }
}
