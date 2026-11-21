import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { validateAddressPayload } from "@/lib/address-validation";

// PUT /api/user/addresses/[id] — update an address
export async function PUT(request, { params }) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const resolvedParams = await params;
    const id = typeof resolvedParams?.id === "string" ? resolvedParams.id.trim() : "";
    if (!id) return NextResponse.json({ error: "ID requerido." }, { status: 400 });

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Dirección no encontrada." }, { status: 404 });

    const validation = validateAddressPayload(parsed.data);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const address = await prisma.$transaction(async (tx) => {
      if (validation.data.isDefault) {
        await tx.address.updateMany({
          where: { userId: user.id, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: validation.data,
      });
    });

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Address PUT Error:", error);
    return NextResponse.json({ error: "Error interno al actualizar dirección." }, { status: 500 });
  }
}

// DELETE /api/user/addresses/[id] — delete an address
export async function DELETE(request, { params }) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const resolvedParams = await params;
    const id = typeof resolvedParams?.id === "string" ? resolvedParams.id.trim() : "";
    if (!id) return NextResponse.json({ error: "ID requerido." }, { status: 400 });

    const deleted = await prisma.address.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Dirección no encontrada." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Address DELETE Error:", error);
    return NextResponse.json({ error: "Error interno al eliminar dirección." }, { status: 500 });
  }
}
