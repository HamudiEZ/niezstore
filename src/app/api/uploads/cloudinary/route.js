import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";

const CLOUDINARY_PRODUCTS_FOLDER = "niezstore";
const CLOUDINARY_RECEIPTS_FOLDER = "niezstore/receipts";

export async function POST(request) {
  const rl = rateLimit(request, { limit: 20, windowMs: 10 * 60 * 1000, keyPrefix: "cloudinary-sig" });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  const isAdmin = await requireAdmin();
  
  // Parse body to see where they want to upload
  const body = await request.json().catch(() => ({}));
  const requestedFolder = body.folder || CLOUDINARY_PRODUCTS_FOLDER;
  const requestedFormats = body.formats || "jpg,jpeg,png";

  // Security: non-admins can ONLY upload to the receipts folder.
  if (!isAdmin && requestedFolder !== CLOUDINARY_RECEIPTS_FOLDER) {
    return NextResponse.json({ error: "No autorizado para esta carpeta." }, { status: 401 });
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

  // Note: resource_type is NOT signed — it goes in the upload URL path (/auto/upload)
  const params = {
    allowed_formats: requestedFormats,
    folder: requestedFolder,
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
    folder: requestedFolder,
    allowedFormats: requestedFormats,
  });
}
