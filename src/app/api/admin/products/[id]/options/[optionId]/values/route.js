import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function POST(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resolvedParams = await params;
  const productId = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
  const optionId =
    typeof resolvedParams?.optionId === "string" ? resolvedParams.optionId : "";

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
    return NextResponse.json({ error: "Opcion no encontrada." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const value = String(body.value ?? "").trim();
  const positionRaw = body.position;
  const position =
    positionRaw === "" || positionRaw == null
      ? option.values.length
      : Number(positionRaw);

  if (!value) {
    return NextResponse.json({ error: "Valor requerido." }, { status: 400 });
  }

  if (!Number.isFinite(position) || position < 0) {
    return NextResponse.json(
      { error: "Posicion de valor invalida." },
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

  return NextResponse.json({ value: created });
}
