import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

import { getCurrentUser } from "@/lib/auth";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id;
    const body = await request.json();
    const { items, customer, shipping, notes } = body;

    // 1. Basic validation
    if (!items || !items.length || !customer || !customer.email) {
      return NextResponse.json(
        { error: "Invalid payload: Missing items or customer details" },
        { status: 400 }
      );
    }

    // 2. Fetch variants securely from database
    const variantIds = items.map((item) => item.variantId);
    
    const dbVariants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true }
    });

    if (dbVariants.length !== variantIds.length) {
      return NextResponse.json(
        { error: "One or more checkout items are invalid or unavailable." },
        { status: 400 }
      );
    }

    // 3. Security calculations and Stock logic
    let subtotalAmount = 0;
    const orderItemsRecord = [];

    for (const item of items) {
      const dbVariant = dbVariants.find(v => v.id === item.variantId);
      
      // Stock evaluation
      if (dbVariant.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product: ${dbVariant.product.name}` },
          { status: 400 }
        );
      }

      // Security: use DB Price, NEVER the client price
      const unitPrice = Number(dbVariant.price);
      const lineTotal = unitPrice * item.quantity;
      
      subtotalAmount += lineTotal;

      orderItemsRecord.push({
        productId: dbVariant.productId,
        variantId: dbVariant.id,
        quantity: item.quantity,
        unitPrice: unitPrice,
        lineTotal: lineTotal,
      });
    }

    const shippingAmount = 0; // Configurable flat-rate or dynamic
    const totalAmount = subtotalAmount + shippingAmount;

    // 4. Create Transaction
    const order = await prisma.$transaction(async (tx) => {
      
      // Calculate order
      const createdOrder = await tx.order.create({
        data: {
          customerName: customer.fullName,
          customerEmail: customer.email,
          customerPhone: customer.phone || null,
          shippingLine1: shipping.line1,
          shippingLine2: shipping.line2 || null,
          shippingCity: shipping.city,
          shippingRegion: shipping.region || null,
          shippingPostal: shipping.postalCode || null,
          subtotalAmount: subtotalAmount,
          shippingAmount: shippingAmount,
          totalAmount: totalAmount,
          shippingCountry: shipping.country || "PY",
          notes: notes || null,
          user: userId ? { connect: { id: userId } } : undefined,
          items: {
            create: orderItemsRecord
          }
        }
      });

      // Clear DB cart if user is authenticated
      if (userId) {
        await tx.userCartItem.deleteMany({
          where: { userId }
        });
      }

      // Update stock
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return createdOrder;
    });

    return NextResponse.json({ success: true, orderCode: order.orderCode }, { status: 201 });

  } catch (error) {
    console.error("Checkout API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during checkout." },
      { status: 500 }
    );
  }
}
