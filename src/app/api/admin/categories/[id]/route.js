import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  isValidAllowedImageUrl,
  parseJsonBody,
  verifySameOrigin,
} from "@/lib/api-security";
import { slugify } from "@/lib/slug";
import { INPUT_LIMITS } from "@/lib/input-limits";

async function getUniqueSlug(base, excludeId) {
  let slug = base;
  for (let counter = 2; counter <= 200; counter += 1) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter}`;
  }
  return `${base}-${Date.now()}`;
}

function isCategoryInUseError(error) {
  if (error?.code === "P2003") return true;
  const causeCode = error?.cause?.code || error?.cause?.originalCode;
  if (causeCode === "23001" || causeCode === "23503") return true;
  const message = String(
    error?.cause?.originalMessage || error?.cause?.message || error?.message || ""
  ).toLowerCase();
  return message.includes("violates restrict setting of foreign key constraint");
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
    const categoryId =
      typeof resolvedParams?.id === "string" ? resolvedParams.id.trim() : "";
    if (!categoryId) {
      return NextResponse.json(
        { error: "ID de categoria requerido." },
        { status: 400 }
      );
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim() || null;
    const imageUrl = String(body.imageUrl ?? "").trim() || null;
    const rawSlug = String(body.slug ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Nombre requerido." }, { status: 400 });
    }
    if (name.length > INPUT_LIMITS.categoryName) {
      return NextResponse.json(
        { error: `Nombre demasiado largo (max ${INPUT_LIMITS.categoryName}).` },
        { status: 400 }
      );
    }
    if (description && description.length > INPUT_LIMITS.categoryDescription) {
      return NextResponse.json(
        { error: `Descripcion demasiado larga (max ${INPUT_LIMITS.categoryDescription}).` },
        { status: 400 }
      );
    }
    if (rawSlug.length > INPUT_LIMITS.slug) {
      return NextResponse.json(
        { error: `Slug demasiado largo (max ${INPUT_LIMITS.slug}).` },
        { status: 400 }
      );
    }
    if (imageUrl && !isValidAllowedImageUrl(imageUrl)) {
      return NextResponse.json(
        { error: "URL de imagen no permitida. Usa HTTPS de Cloudinary o Unsplash." },
        { status: 400 }
      );
    }

    const existingByName = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        NOT: { id: categoryId },
      },
    });
    if (existingByName) {
      return NextResponse.json(
        { error: "Ya existe una categoria con ese nombre." },
        { status: 409 }
      );
    }

    const baseSlug = slugify(rawSlug || name);
    if (!baseSlug) {
      return NextResponse.json({ error: "Slug invalido." }, { status: 400 });
    }

    const slug = await getUniqueSlug(baseSlug, categoryId);

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name, slug, description, imageUrl },
    });

    return NextResponse.json({ category });
  } catch (error) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Categoria no encontrada." }, { status: 404 });
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una categoria con ese slug." },
        { status: 409 }
      );
    }
    console.error("Admin Category PUT Error:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar categoria." },
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
    const categoryId =
      typeof resolvedParams?.id === "string" ? resolvedParams.id.trim() : "";
    if (!categoryId) {
      return NextResponse.json(
        { error: "ID de categoria requerido." },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Categoria no encontrada." }, { status: 404 });
    }
    if (isCategoryInUseError(error)) {
      return NextResponse.json(
        {
          error:
            "No puedes eliminar esta categoria porque tiene productos asociados.",
        },
        { status: 409 }
      );
    }
    console.error("Admin Category DELETE Error:", error);
    return NextResponse.json(
      { error: "Error interno al eliminar categoria." },
      { status: 500 }
    );
  }
}
