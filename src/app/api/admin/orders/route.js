import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { normalizeSearchTerm } from "@/lib/input-limits";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function normalizeStatusFilter(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (!normalized || normalized === "ALL") return "all";
  if (normalized === "PENDING") return "PENDING";
  if (
    normalized === "PAID" ||
    normalized === "PENDING_PAYMENT" ||
    normalized === "PROCESSING" ||
    normalized === "SHIPPED" ||
    normalized === "DELIVERED" ||
    normalized === "CANCELLED"
  ) {
    return normalized;
  }
  return "all";
}

export async function GET(request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = normalizeSearchTerm(searchParams.get("search"));
    const status = normalizeStatusFilter(searchParams.get("status"));
    const pageSize = Math.min(
      parsePositiveInteger(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE
    );
    const requestedPage = parsePositiveInteger(
      searchParams.get("page"),
      DEFAULT_PAGE
    );

    const where = {};
    if (status === "PENDING") {
      where.status = { in: ["PENDING_PAYMENT"] };
    } else if (status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderCode: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [filteredTotal, totalAll] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count(),
    ]);

    const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const skip = (page - 1) * pageSize;

    const orders = await prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        payments: true,
        auditLogs: {
          include: {
            admin: {
              select: { fullName: true }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({
      orders,
      pagination: {
        page,
        pageSize,
        total: filteredTotal,
        totalPages,
        totalAll,
      },
    });

  } catch (error) {
    console.error("Admin Orders API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
