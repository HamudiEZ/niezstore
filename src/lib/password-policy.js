export const MIN_PASSWORD_LENGTH = 8;

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
  "welcome123",
]);

function normalizeToken(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
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
    .toLowerCase()
    .split(/\s+/)
    .map((part) => normalizeToken(part))
    .filter((part) => part.length >= 3)
    .forEach((part) => tokens.add(part));

  return tokens;
}

export function getPasswordChecks(password, context = {}) {
  const value = String(password ?? "");
  const lowered = value.toLowerCase();
  const personalTokens = extractPersonalTokens(context);
  const containsPersonalData = Array.from(personalTokens).some((token) =>
    lowered.includes(token),
  );

  return {
    length: value.length >= MIN_PASSWORD_LENGTH,
    lowercase: /[a-z]/.test(value),
    uppercase: /[A-Z]/.test(value),
    number: /[0-9]/.test(value),
    symbol: /[^A-Za-z0-9\s]/.test(value),
    noSpaces: !/\s/.test(value),
    notCommon: !COMMON_PASSWORDS.has(lowered),
    notPersonalData: !containsPersonalData,
  };
}

export function validatePasswordStrength(password, context = {}) {
  const checks = getPasswordChecks(password, context);
  const errors = [];

  if (!checks.length) {
    errors.push(
      `La contrase\u00f1a debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    );
  }
  if (!checks.lowercase) {
    errors.push(
      "La contrase\u00f1a debe incluir al menos una letra min\u00fascula.",
    );
  }
  if (!checks.uppercase) {
    errors.push(
      "La contrase\u00f1a debe incluir al menos una letra may\u00fascula.",
    );
  }
  if (!checks.number) {
    errors.push("La contrase\u00f1a debe incluir al menos un n\u00famero.");
  }
  if (!checks.symbol) {
    errors.push("La contrase\u00f1a debe incluir al menos un s\u00edmbolo.");
  }
  if (!checks.noSpaces) {
    errors.push("La contrase\u00f1a no puede contener espacios.");
  }
  if (!checks.notCommon) {
    errors.push(
      "Esa contrase\u00f1a es demasiado com\u00fan. Elige otra m\u00e1s segura.",
    );
  }
  if (!checks.notPersonalData) {
    errors.push("La contrase\u00f1a no debe incluir tu nombre o correo.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    checks,
  };
}
