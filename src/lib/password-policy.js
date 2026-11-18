export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_BYTES = 72;

const COMMON_PASSWORDS = new Set([
  "123456",
  "12345678",
  "123456789",
  "qwerty",
  "password",
  "password123",
  "abc123",
  "111111",
  "000000",
  "admin",
  "admin123",
  "letmein",
  "welcome",
  "welcome123",
]);

const COMMON_BASES = [
  "password",
  "qwerty",
  "admin",
  "welcome",
  "letmein",
  "123456",
  "111111",
  "000000",
  "abc123",
];

function normalizeToken(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

function getUtf8ByteLength(value) {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(value).length;
  }
  return Buffer.byteLength(value, "utf8");
}

function extractPersonalTokens({ email, fullName }) {
  const tokens = new Set();
  const normalizedEmail = String(email ?? "")
    .toLowerCase()
    .trim();
  const emailLocalPart = normalizedEmail.split("@")[0] ?? "";
  const normalizedEmailLocalPart = normalizeToken(emailLocalPart);
  if (normalizedEmailLocalPart.length >= 3) {
    tokens.add(normalizedEmailLocalPart);
  }

  String(fullName ?? "")
    .split(/\s+/)
    .map((part) => normalizeToken(part))
    .filter((part) => part.length >= 3)
    .forEach((part) => tokens.add(part));

  return tokens;
}

export function getPasswordChecks(password, context = {}) {
  const value = String(password ?? "");
  const lowered = value.toLowerCase();
  const normalizedAlphaNum = normalizeToken(value);
  const strippedBase = normalizedAlphaNum.replace(/[0-9]+$/g, "");
  const personalTokens = extractPersonalTokens(context);
  const containsPersonalData = Array.from(personalTokens).some((token) =>
    normalizedAlphaNum.includes(token),
  );
  const isCommonPassword =
    COMMON_PASSWORDS.has(lowered) ||
    COMMON_PASSWORDS.has(normalizedAlphaNum) ||
    COMMON_BASES.includes(strippedBase);

  return {
    length: value.length >= MIN_PASSWORD_LENGTH,
    maxLength: getUtf8ByteLength(value) <= MAX_PASSWORD_BYTES,
    lowercase: /[a-z]/.test(value),
    uppercase: /[A-Z]/.test(value),
    number: /[0-9]/.test(value),
    symbol: /[^A-Za-z0-9\s]/.test(value),
    noSpaces: !/\s/.test(value),
    notCommon: !isCommonPassword,
    notPersonalData: !containsPersonalData,
  };
}

export function validatePasswordStrength(password, context = {}) {
  const checks = getPasswordChecks(password, context);
  const errors = [];

  if (!checks.length) {
    errors.push(
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }
  if (!checks.maxLength) {
    errors.push(
      `La contraseña no puede superar ${MAX_PASSWORD_BYTES} bytes.`,
    );
  }
  if (!checks.lowercase) {
    errors.push(
      "La contraseña debe incluir al menos una letra minúscula.",
    );
  }
  if (!checks.uppercase) {
    errors.push(
      "La contraseña debe incluir al menos una letra mayúscula.",
    );
  }
  if (!checks.number) {
    errors.push("La contraseña debe incluir al menos un número.");
  }
  if (!checks.symbol) {
    errors.push("La contraseña debe incluir al menos un símbolo.");
  }
  if (!checks.noSpaces) {
    errors.push("La contraseña no puede contener espacios.");
  }
  if (!checks.notCommon) {
    errors.push(
      "Esa contraseña es demasiado común. Elige otra más segura.",
    );
  }
  if (!checks.notPersonalData) {
    errors.push("La contraseña no debe incluir tu nombre o correo.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    checks,
  };
}
