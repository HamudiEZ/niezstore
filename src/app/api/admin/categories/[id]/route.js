import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slug";

async function getUniqueSlug(base, excludeId) {
  let slug = base;
  let counter = 2;
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
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
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resolvedParams = await params;
  const categoryId = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
  if (!categoryId) {
    return NextResponse.json(
      { error: "ID de categoria requerido." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim() || null;
  const imageUrl = String(body.imageUrl ?? "").trim() || null;
  const rawSlug = String(body.slug ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Nombre requerido." }, { status: 400 });
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
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resolvedParams = await params;
  const categoryId = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
  if (!categoryId) {
    return NextResponse.json(
      { error: "ID de categoria requerido." },
      { status: 400 }
    );
  }

  try {
    await prisma.category.delete({ where: { id: categoryId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isCategoryInUseError(error)) {
      return NextResponse.json(
        {
          error:
            "No puedes eliminar esta categoria porque tiene productos asociados.",
        },
        { status: 409 }
      );
    }
    throw error;
  }
}
