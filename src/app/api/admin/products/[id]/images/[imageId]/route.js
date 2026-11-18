import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { verifySameOrigin } from "@/lib/api-security";

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
    const imageId =
      typeof resolvedParams?.imageId === "string"
        ? resolvedParams.imageId.trim()
        : "";

    if (!productId || !imageId) {
      return NextResponse.json(
        { error: "ID de producto y de imagen requeridos." },
        { status: 400 }
      );
    }

    const deleted = await prisma.productImage.deleteMany({
      where: { id: imageId, productId },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Imagen no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin Product Image DELETE Error:", error);
    return NextResponse.json(
      { error: "Error interno al eliminar imagen." },
      { status: 500 }
    );
  }
}
