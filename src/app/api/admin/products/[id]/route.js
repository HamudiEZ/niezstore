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

export async function GET(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resolvedParams = await params;
  const productId = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
  if (!productId) {
    return NextResponse.json({ error: "ID de producto requerido." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      images: {
        orderBy: { position: "asc" },
      },
      options: {
        include: {
          values: {
            orderBy: { position: "asc" },
          },
        },
        orderBy: { position: "asc" },
      },
      variants: {
        include: {
          variantOptions: {
            include: {
              optionValue: {
                include: {
                  option: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PUT(request, { params }) {
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
  const hasIsActiveOnly =
    Object.prototype.hasOwnProperty.call(body, "isActive") &&
    Object.keys(body).length === 1;
  const isActive = body.isActive !== false;

  if (hasIsActiveOnly) {
    const product = await prisma.product.update({
      where: { id: productId },
      data: { isActive },
    });
    return NextResponse.json({ product });
  }

  const name = String(body.name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const brand = String(body.brand ?? "").trim() || null;
  const categoryId = String(body.categoryId ?? "").trim();
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

  const slug = await getUniqueSlug(baseSlug, productId);

  const product = await prisma.product.update({
    where: { id: productId },
    data: { name, slug, description, brand, categoryId, isActive },
  });

  return NextResponse.json({ product });
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resolvedParams = await params;
  const productId = typeof resolvedParams?.id === "string" ? resolvedParams.id : "";
  if (!productId) {
    return NextResponse.json({ error: "ID de producto requerido." }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: { isActive: false },
  });

  return NextResponse.json({ product });
}
