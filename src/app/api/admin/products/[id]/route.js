import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { slugify } from "@/lib/slug";
import { INPUT_LIMITS } from "@/lib/input-limits";

async function getUniqueSlug(base, excludeId) {
  let slug = base;
  for (let counter = 2; counter <= 200; counter += 1) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter}`;
  }
  return `${base}-${Date.now()}`;
}

export async function GET(request, { params }) {
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
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Admin Product GET Error:", error);
    return NextResponse.json(
      { error: "Error interno al obtener producto." },
      { status: 500 }
    );
  }
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

    const body = parsed.data;
    const hasIsActiveOnly =
      Object.prototype.hasOwnProperty.call(body, "isActive") &&
      Object.keys(body).length === 1;

    if (hasIsActiveOnly) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { error: "Valor de estado invalido." },
          { status: 400 }
        );
      }
      const product = await prisma.product.update({
        where: { id: productId },
        data: { isActive: body.isActive },
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
    if (name.length > INPUT_LIMITS.productName) {
      return NextResponse.json(
        { error: `Nombre demasiado largo (max ${INPUT_LIMITS.productName}).` },
        { status: 400 }
      );
    }
    if (description.length > INPUT_LIMITS.productDescription) {
      return NextResponse.json(
        { error: `Descripcion demasiado larga (max ${INPUT_LIMITS.productDescription}).` },
        { status: 400 }
      );
    }
    if (brand && brand.length > INPUT_LIMITS.productBrand) {
      return NextResponse.json(
        { error: `Marca demasiado larga (max ${INPUT_LIMITS.productBrand}).` },
        { status: 400 }
      );
    }
    if (rawSlug.length > INPUT_LIMITS.slug) {
      return NextResponse.json(
        { error: `Slug demasiado largo (max ${INPUT_LIMITS.slug}).` },
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
      data: {
        name,
        slug,
        description,
        brand,
        categoryId,
        ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 }
      );
    }
    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "La categoria seleccionada no existe." },
        { status: 400 }
      );
    }
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un producto con ese slug." },
        { status: 409 }
      );
    }
    console.error("Admin Product PUT Error:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar producto." },
      { status: 500 }
    );
  }
}

/**
 * Soft-delete: marca el producto como inactivo (isActive = false).
 */
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
    if (!productId) {
      return NextResponse.json(
        { error: "ID de producto requerido." },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });

    return NextResponse.json({ product });
  } catch (error) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 }
      );
    }
    console.error("Admin Product DELETE Error:", error);
    return NextResponse.json(
      { error: "Error interno al desactivar producto." },
      { status: 500 }
    );
  }
}
