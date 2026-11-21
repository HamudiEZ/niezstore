import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { INPUT_LIMITS } from "@/lib/input-limits";

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

    const body = parsed.data;
    const name = String(body.name ?? "").trim();
    const positionRaw = body.position;
    const position =
      positionRaw === "" || positionRaw == null ? 0 : Number(positionRaw);
    const values = Array.isArray(body.values) ? body.values : [];

    if (!name) {
      return NextResponse.json(
        { error: "Nombre de opcion requerido." },
        { status: 400 }
      );
    }
    if (name.length > INPUT_LIMITS.optionName) {
      return NextResponse.json(
        {
          error: `Nombre de opcion demasiado largo (max ${INPUT_LIMITS.optionName}).`,
        },
        { status: 400 }
      );
    }
    if (
      typeof positionRaw === "boolean" ||
      !Number.isInteger(position) ||
      position < 0 ||
      position > INPUT_LIMITS.optionPositionMax
    ) {
      return NextResponse.json(
        {
          error: `Posicion invalida (entero de 0 a ${INPUT_LIMITS.optionPositionMax}).`,
        },
        { status: 400 }
      );
    }

    const normalizedValues = values
      .map((value, index) => ({
        value: String(value ?? "").trim(),
        position: index,
      }))
      .filter((entry) => entry.value.length > 0);

    const hasTooLongValue = normalizedValues.some(
      (entry) => entry.value.length > INPUT_LIMITS.optionValue
    );
    if (hasTooLongValue) {
      return NextResponse.json(
        {
          error: `Cada valor debe tener maximo ${INPUT_LIMITS.optionValue} caracteres.`,
        },
        { status: 400 }
      );
    }

    const uniqueValues = [];
    const valueSet = new Set();
    for (const entry of normalizedValues) {
      const key = entry.value.toLowerCase();
      if (valueSet.has(key)) continue;
      valueSet.add(key);
      uniqueValues.push(entry);
    }

    if (uniqueValues.length === 0) {
      return NextResponse.json(
        { error: "Debes ingresar al menos un valor inicial para la opcion." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        options: { select: { name: true } },
      },
    });
    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado." },
        { status: 404 }
      );
    }

    const duplicateName = product.options.some(
      (opt) => opt.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicateName) {
      return NextResponse.json(
        { error: "Ya existe una opcion con ese nombre en este producto." },
        { status: 409 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const option = await tx.productOption.create({
        data: {
          name,
          position,
          productId,
          values: {
            create: uniqueValues,
          },
        },
        include: { values: true },
      });

      // Adding a new option makes all prior variants incomplete until recreated/configured
      const deactivated = await tx.productVariant.updateMany({
        where: {
          productId,
          isActive: true,
        },
        data: { isActive: false },
      });

      return { option, deactivatedBaseVariants: deactivated.count };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Admin Product Options POST Error:", error);
    return NextResponse.json(
      { error: "Error interno al crear opcion." },
      { status: 500 }
    );
  }
}
