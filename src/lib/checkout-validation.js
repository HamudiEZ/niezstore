import { INPUT_LIMITS } from "@/lib/input-limits";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_ALLOWED_REGEX = /^\+?[0-9\s()\-]{7,22}$/;
const POSTAL_CODE_REGEX = /^\d{3,10}$/;

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizePhoneInput(value) {
  const raw = String(value ?? "");
  const hasLeadingPlus = raw.trimStart().startsWith("+");

  let sanitized = raw.replace(/[^0-9+()\-\s]/g, "");
  sanitized = sanitized.replace(/\+/g, "");
  sanitized = `${hasLeadingPlus ? "+" : ""}${sanitized}`;
  sanitized = sanitized.replace(/\s{2,}/g, " ").slice(0, INPUT_LIMITS.checkoutPhone);

  return sanitized;
}

export function sanitizePostalCodeInput(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, INPUT_LIMITS.checkoutPostalCode);
}

export function sanitizeNameInput(value) {
  return String(value ?? "").replace(/[^\p{L}\s'-]/gu, "");
}

function validatePhone(rawPhone) {
  const trimmed = normalizeText(rawPhone);
  if (!trimmed) return null;

  if (!PHONE_ALLOWED_REGEX.test(trimmed)) {
    return "Telefono invalido. Usa solo numeros y opcionalmente +, espacios o guiones.";
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return "Telefono invalido. Debe tener entre 7 y 15 digitos.";
  }

  return null;
}

function validatePostalCode(rawPostalCode) {
  const trimmed = normalizeText(rawPostalCode);
  if (!trimmed) return null;
  if (!POSTAL_CODE_REGEX.test(trimmed)) {
    return "Codigo postal invalido. Usa solo numeros (3 a 10 digitos).";
  }
  return null;
}

export function normalizeCheckoutFormData(input) {
  const fullName = normalizeText(input?.fullName);
  const email = normalizeText(input?.email).toLowerCase();
  const phone = normalizeText(input?.phone);
  const line1 = normalizeText(input?.line1);
  const city = normalizeText(input?.city);
  const postalCode = normalizeText(input?.postalCode);

  return {
    fullName,
    email,
    phone,
    line1,
    city,
    postalCode,
  };
}

export function validateCheckoutFormData(input) {
  const normalized = normalizeCheckoutFormData(input);
  const errors = {};

  if (!normalized.fullName || normalized.fullName.length < 3) {
    errors.fullName = "Ingresa tu nombre completo.";
  } else if (normalized.fullName.length > INPUT_LIMITS.checkoutFullName) {
    errors.fullName = `El nombre no puede superar ${INPUT_LIMITS.checkoutFullName} caracteres.`;
  }

  if (
    !normalized.email ||
    normalized.email.length > INPUT_LIMITS.userEmail ||
    !EMAIL_REGEX.test(normalized.email)
  ) {
    errors.email = "Correo electronico invalido.";
  }

  if (!normalized.line1 || normalized.line1.length < 6) {
    errors.line1 = "Ingresa una direccion valida.";
  } else if (normalized.line1.length > INPUT_LIMITS.checkoutLine1) {
    errors.line1 = `La direccion no puede superar ${INPUT_LIMITS.checkoutLine1} caracteres.`;
  }

  if (!normalized.city || normalized.city.length < 2) {
    errors.city = "Ingresa una ciudad valida.";
  } else if (normalized.city.length > INPUT_LIMITS.checkoutCity) {
    errors.city = `La ciudad no puede superar ${INPUT_LIMITS.checkoutCity} caracteres.`;
  }

  const phoneError = validatePhone(normalized.phone);
  if (phoneError) {
    errors.phone = phoneError;
  }

  const postalCodeError = validatePostalCode(normalized.postalCode);
  if (postalCodeError) {
    errors.postalCode = postalCodeError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalized: {
      ...normalized,
      phone: normalized.phone ? sanitizePhoneInput(normalized.phone).trim() : "",
      postalCode: normalized.postalCode
        ? sanitizePostalCodeInput(normalized.postalCode)
        : "",
    },
  };
}
