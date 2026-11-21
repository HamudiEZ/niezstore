import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  isValidAllowedImageUrl,
  parseJsonBody,
  verifySameOrigin,
} from "@/lib/api-security";
import { slugify } from "@/lib/slug";
import { INPUT_LIMITS, normalizeSearchTerm } from "@/lib/input-limits";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 5;
const MAX_PAGE_SIZE = 50;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

async function getUniqueSlug(base, excludeId) {
  let slug = base;
  for (let counter = 2; counter <= 200; counter += 1) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter}`;
  }
  return `${base}-${Date.now()}`;
}

export async function GET(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const scope = String(searchParams.get("scope") ?? "").trim().toLowerCase();

    if (scope === "all") {
      const categories = await prisma.category.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

      return NextResponse.json({
        categories,
        pagination: {
          page: 1,
          pageSize: categories.length || 1,
          total: categories.length,
          totalPages: 1,
          totalAll: categories.length,
        },
        totalAll: categories.length,
      });
    }

    const search = normalizeSearchTerm(searchParams.get("search"));
    const pageSize = Math.min(
      parsePositiveInteger(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE
    );
    const requestedPage = parsePositiveInteger(
      searchParams.get("page"),
      DEFAULT_PAGE
    );

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [filteredTotal, totalAll] = await Promise.all([
      prisma.category.count({ where }),
      prisma.category.count(),
    ]);

    const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const skip = (page - 1) * pageSize;

    const categories = await prisma.category.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      categories,
      pagination: {
        page,
        pageSize,
        total: filteredTotal,
        totalPages,
        totalAll,
      },
      totalAll,
    });
  } catch (error) {
    console.error("Admin Categories GET Error:", error);
    return NextResponse.json(
      { error: "Error interno al cargar categorias." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
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

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe una categoria con ese nombre o slug." },
        { status: 409 }
      );
    }
    console.error("Admin Categories POST Error:", error);
    return NextResponse.json(
      { error: "Error interno al crear categoria." },
      { status: 500 }
    );
  }
}
