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
  const name = String(body.name ?? "").trim();
  const position = Number.isFinite(body.position) ? body.position : 0;
  const values = Array.isArray(body.values) ? body.values : [];

  if (!name) {
    return NextResponse.json({ error: "Nombre de opcion requerido." }, { status: 400 });
  }

  const option = await prisma.productOption.create({
    data: {
      name,
      position,
      productId,
      values: {
        create: values
          .map((value, index) => ({
            value: String(value ?? "").trim(),
            position: index,
          }))
          .filter((entry) => entry.value.length > 0),
      },
    },
    include: { values: true },
  });

  return NextResponse.json({ option });
}
