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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ categories });
}

export async function POST(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
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
    where: { name: { equals: name, mode: "insensitive" } },
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

  const slug = await getUniqueSlug(baseSlug);

  const category = await prisma.category.create({
    data: { name, slug, description, imageUrl },
  });

  return NextResponse.json({ category });
}
