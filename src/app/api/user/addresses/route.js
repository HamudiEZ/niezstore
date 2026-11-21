import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseJsonBody, verifySameOrigin } from "@/lib/api-security";
import { INPUT_LIMITS } from "@/lib/input-limits";
import { validateAddressPayload } from "@/lib/address-validation";

class AddressLimitError extends Error {}

// GET /api/user/addresses — list all addresses for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Addresses GET Error:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}

// POST /api/user/addresses — create a new address
export async function POST(request) {
  const originCheck = verifySameOrigin(request);
  if (!originCheck.ok) return originCheck.response;

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;

    const validation = validateAddressPayload(parsed.data);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const address = await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId: user.id } });
      if (count >= INPUT_LIMITS.maxAddressesPerUser) {
        throw new AddressLimitError(
          `Has alcanzado el límite de ${INPUT_LIMITS.maxAddressesPerUser} direcciones.`
        );
      }

      if (validation.data.isDefault) {
        await tx.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: user.id,
          ...validation.data,
        },
      });
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    if (error instanceof AddressLimitError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Addresses POST Error:", error);
    return NextResponse.json({ error: "Error interno al guardar dirección." }, { status: 500 });
  }
}
