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
  if (!productId) {
    return NextResponse.json({ error: "ID de producto requerido." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const urls = Array.isArray(body.urls)
    ? body.urls.map((url) => String(url ?? "").trim()).filter(Boolean)
    : [];
  const validUrls = urls.filter((url) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") return false;
      if (parsed.hostname !== "res.cloudinary.com") return false;
      if (cloudName) {
        if (!parsed.pathname.startsWith(`/${cloudName}/`)) return false;
        if (!parsed.pathname.includes("/image/upload/")) return false;
      }
      return true;
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    return NextResponse.json({ error: "Sin URLs para guardar." }, { status: 400 });
  }

  const existingCount = await prisma.productImage.count({
    where: { productId },
  });

  const images = await prisma.$transaction(
    validUrls.map((url, index) =>
      prisma.productImage.create({
        data: {
          productId,
          url,
          position: existingCount + index,
        },
      })
    )
  );

  return NextResponse.json({ images });
}
