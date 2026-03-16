import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slug";

async function getUniqueSlug(base, excludeId) {
  let slug = base;
  let counter = 2;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      variants: true,
    },
  });

  return NextResponse.json({ products });
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const brand = String(body.brand ?? "").trim() || null;
  const categoryId = String(body.categoryId ?? "").trim();
  const isActive = body.isActive !== false;
  const rawSlug = String(body.slug ?? "").trim();

  if (!name || !description || !categoryId) {
    return NextResponse.json(
      { error: "Nombre, descripcion y categoria son obligatorios." },
      { status: 400 }
    );
  }

  const baseSlug = slugify(rawSlug || name);
  if (!baseSlug) {
    return NextResponse.json({ error: "Slug invalido." }, { status: 400 });
  }

  const slug = await getUniqueSlug(baseSlug);

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      brand,
      categoryId,
      isActive,
    },
  });

  return NextResponse.json({ product });
}
