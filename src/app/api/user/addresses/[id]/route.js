import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { INPUT_LIMITS } from "@/lib/input-limits";

// PUT /api/user/addresses/[id] — update an address
export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { label, receiver, line1, line2, city, region, postalCode, countryCode, isDefault } = body;

  // Ownership check
  const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Dirección no encontrada." }, { status: 404 });

  if (!receiver?.trim() || !line1?.trim() || !city?.trim()) {
    return NextResponse.json({ error: "Nombre del destinatario, dirección y ciudad son obligatorios." }, { status: 400 });
  }

  const address = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({
        where: { userId: user.id, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return tx.address.update({
      where: { id },
      data: {
        label: label?.trim() || null,
        receiver: receiver.trim(),
        line1: line1.trim(),
        line2: line2?.trim() || null,
        city: city.trim(),
        region: region?.trim() || null,
        postalCode: postalCode?.trim() || null,
        countryCode: countryCode?.trim() || "PY",
        isDefault: !!isDefault,
      },
    });
  });

  return NextResponse.json({ address });
}

// DELETE /api/user/addresses/[id] — delete an address
export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { id } = await params;

  // Ownership check
  const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Dirección no encontrada." }, { status: 404 });

  await prisma.address.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
