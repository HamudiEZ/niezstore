import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { INPUT_LIMITS } from "@/lib/input-limits";

const MAX_IMAGES_PER_REQUEST = 10;

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
    if (!productId) {
      return NextResponse.json(
        { error: "ID de producto requerido." },
        { status: 400 }
      );
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const rawUrls = Array.isArray(parsed.data.urls)
      ? parsed.data.urls
          .filter((url) => typeof url === "string")
          .map((url) => url.trim())
          .filter(Boolean)
          .slice(0, MAX_IMAGES_PER_REQUEST)
      : [];

    const validUrls = rawUrls.filter((url) => {
      if (url.length > INPUT_LIMITS.imageUrl) return false;
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== "https:") return false;
        if (parsedUrl.hostname !== "res.cloudinary.com") return false;
        if (cloudName && !parsedUrl.pathname.startsWith(`/${cloudName}/`)) {
          return false;
        }
        return parsedUrl.pathname.includes("/image/upload/");
      } catch {
        return false;
      }
    });

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "Sin URLs validas para guardar." },
        { status: 400 }
      );
    }

    const images = await prisma.$transaction(async (tx) => {
      const productExists = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!productExists) {
        return null;
      }

      const maxAgg = await tx.productImage.aggregate({
        where: { productId },
        _max: { position: true },
      });
      const startPos = (maxAgg._max.position ?? -1) + 1;

      const created = [];
      for (let index = 0; index < validUrls.length; index += 1) {
        const img = await tx.productImage.create({
          data: {
            productId,
            url: validUrls[index],
            position: startPos + index,
          },
        });
        created.push(img);
      }
      return created;
    });

    if (!images) {
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ images }, { status: 201 });
  } catch (error) {
    console.error("Admin Product Images POST Error:", error);
    return NextResponse.json(
      { error: "Error interno al guardar imagenes." },
      { status: 500 }
    );
  }
}
