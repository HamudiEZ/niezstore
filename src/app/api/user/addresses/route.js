import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { INPUT_LIMITS } from "@/lib/input-limits";

// GET /api/user/addresses — list all addresses for the current user
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ addresses });
}

// POST /api/user/addresses — create a new address
export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { label, receiver, line1, line2, city, region, postalCode, countryCode, isDefault } = body;
  
  // Count existing addresses to enforce limit
  const count = await prisma.address.count({ where: { userId: user.id } });
  if (count >= INPUT_LIMITS.maxAddressesPerUser) {
    return NextResponse.json({ error: `Has alcanzado el límite de ${INPUT_LIMITS.maxAddressesPerUser} direcciones.` }, { status: 400 });
  }

  if (!receiver?.trim() || !line1?.trim() || !city?.trim()) {
    return NextResponse.json({ error: "Nombre del destinatario, dirección y ciudad son obligatorios." }, { status: 400 });
  }

  // Validate lengths using INPUT_LIMITS
  if (receiver.trim().length > INPUT_LIMITS.checkoutFullName) {
    return NextResponse.json({ error: `El nombre no puede superar ${INPUT_LIMITS.checkoutFullName} caracteres.` }, { status: 400 });
  }
  if (line1.trim().length > INPUT_LIMITS.checkoutLine1) {
    return NextResponse.json({ error: `La dirección no puede superar ${INPUT_LIMITS.checkoutLine1} caracteres.` }, { status: 400 });
  }
  if (city.trim().length > INPUT_LIMITS.checkoutCity) {
    return NextResponse.json({ error: `La ciudad no puede superar ${INPUT_LIMITS.checkoutCity} caracteres.` }, { status: 400 });
  }

  const address = await prisma.$transaction(async (tx) => {
    // If new address is default, unset all others first
    if (isDefault) {
      await tx.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        userId: user.id,
        label: label?.trim() || null,
        receiver: receiver.trim(),
        line1: line1.trim(),
        line2: line2?.trim() || null,
        city: city.trim(),
        region: region?.trim() || null,
        postalCode: postalCode?.trim() || null,
        countryCode: countryCode?.trim() || "PY",
        isDefault: !!isDefault,
      },
    });
  });

  return NextResponse.json({ address }, { status: 201 });
}
