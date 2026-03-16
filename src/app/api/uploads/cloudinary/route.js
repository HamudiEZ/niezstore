import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/admin";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary no configurado en el servidor." },
      { status: 500 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "niezstore";
  const allowedFormats = "jpg,jpeg,png";

  const params = {
    allowed_formats: allowedFormats,
    folder,
    timestamp,
  };
  const sortedKeys = Object.keys(params).sort();
  const paramsToSign = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    allowedFormats,
  });
}
