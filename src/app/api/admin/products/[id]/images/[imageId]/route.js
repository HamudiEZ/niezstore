import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function DELETE(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resolvedParams = await params;
  const imageId = typeof resolvedParams?.imageId === "string" ? resolvedParams.imageId : "";
  if (!imageId) {
    return NextResponse.json({ error: "ID de imagen requerido." }, { status: 400 });
  }

  await prisma.productImage.delete({
    where: { id: imageId },
  });

  return NextResponse.json({ ok: true });
}
