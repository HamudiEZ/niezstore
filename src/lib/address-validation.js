import { INPUT_LIMITS } from "./input-limits";

function normalizeStringField(value) {
  if (value == null) return "";
  if (typeof value !== "string") return null;
  return value.trim();
}

export function validateAddressPayload(body) {
  const label = normalizeStringField(body.label);
  const receiver = normalizeStringField(body.receiver);
  const line1 = normalizeStringField(body.line1);
  const line2 = normalizeStringField(body.line2);
  const city = normalizeStringField(body.city);
  const region = normalizeStringField(body.region);
  const postalCode = normalizeStringField(body.postalCode);
  const countryCode = normalizeStringField(body.countryCode);

  if (
    label === null ||
    receiver === null ||
    line1 === null ||
    line2 === null ||
    city === null ||
    region === null ||
    postalCode === null ||
    countryCode === null
  ) {
    return { ok: false, error: "Formato de campos de dirección inválido." };
  }

  if (!receiver || !line1 || !city) {
    return {
      ok: false,
      error: "Nombre del destinatario, dirección y ciudad son obligatorios.",
    };
  }
  if (receiver.length < 2 || receiver.length > INPUT_LIMITS.addressReceiver) {
    return {
      ok: false,
      error: `El nombre debe tener entre 2 y ${INPUT_LIMITS.addressReceiver} caracteres.`,
    };
  }
  if (line1.length < 6 || line1.length > INPUT_LIMITS.checkoutLine1) {
    return {
      ok: false,
      error: `La dirección debe tener entre 6 y ${INPUT_LIMITS.checkoutLine1} caracteres.`,
    };
  }
  if (line2.length > INPUT_LIMITS.checkoutLine2) {
    return {
      ok: false,
      error: `La referencia no puede superar ${INPUT_LIMITS.checkoutLine2} caracteres.`,
    };
  }
  if (city.length < 2 || city.length > INPUT_LIMITS.checkoutCity) {
    return {
      ok: false,
      error: `La ciudad debe tener entre 2 y ${INPUT_LIMITS.checkoutCity} caracteres.`,
    };
  }
  if (label.length > INPUT_LIMITS.addressLabel) {
    return {
      ok: false,
      error: `La etiqueta no puede superar ${INPUT_LIMITS.addressLabel} caracteres.`,
    };
  }
  if (region.length > INPUT_LIMITS.checkoutRegion) {
    return {
      ok: false,
      error: `La región no puede superar ${INPUT_LIMITS.checkoutRegion} caracteres.`,
    };
  }
  if (
    postalCode &&
    (postalCode.length > INPUT_LIMITS.checkoutPostalCode || !/^\d{3,10}$/.test(postalCode))
  ) {
    return {
      ok: false,
      error: "Código postal inválido (3 a 10 dígitos).",
    };
  }
  const normalizedCountry = (countryCode || "PY").toUpperCase();
  if (normalizedCountry.length !== INPUT_LIMITS.checkoutCountry) {
    return { ok: false, error: "Código de país inválido." };
  }

  return {
    ok: true,
    data: {
      label: label || null,
      receiver,
      line1,
      line2: line2 || null,
      city,
      region: region || null,
      postalCode: postalCode || null,
      countryCode: normalizedCountry,
      isDefault: Boolean(body.isDefault),
    },
  };
}
