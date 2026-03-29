import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PUT(request, { params }) {
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
    select: { id: true },
  });
  if (!option) {
    return NextResponse.json({ error: "Opcion no encontrada." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const positionRaw = body.position;
  const position =
    positionRaw === "" || positionRaw == null ? null : Number(positionRaw);

  if (!name) {
    return NextResponse.json({ error: "Nombre de opcion requerido." }, { status: 400 });
  }

  if (position != null && (!Number.isFinite(position) || position < 0)) {
    return NextResponse.json(
      { error: "Posicion de opcion invalida." },
      { status: 400 }
    );
  }

  const updated = await prisma.productOption.update({
    where: { id: optionId },
    data: {
      name,
      ...(position != null ? { position } : {}),
    },
    include: { values: true },
  });

  return NextResponse.json({ option: updated });
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
    return NextResponse.json({ error: "Opcion no encontrada." }, { status: 404 });
  }

  const usedCount = await prisma.variantOption.count({
    where: {
      optionValue: { optionId },
      variant: { productId },
    },
  });

  if (usedCount > 0) {
    return NextResponse.json(
      {
        error:
          "No puedes eliminar esta opcion porque esta siendo usada por variantes.",
      },
      { status: 409 }
    );
  }

  await prisma.productOption.delete({ where: { id: optionId } });
  return NextResponse.json({ ok: true });
}
