/**
 * Configuración de datos bancarios para pagos por transferencia.
 * Todas las variables se leen desde el entorno (NEXT_PUBLIC_BANK_*).
 * Nunca hardcodear valores aquí — configurar en .env o en las variables
 * de entorno de Vercel/producción.
 */
export const BANK_DETAILS = {
  /** Nombre del banco. Ej: "Banco Familiar" */
  bank: process.env.NEXT_PUBLIC_BANK_NAME ?? "",
  /** Nombre del titular de la cuenta. Ej: "Niez Store SRL Comercial" */
  holder: process.env.NEXT_PUBLIC_BANK_HOLDER ?? "",
  /** Número de cuenta bancaria. */
  account: process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "",
  /** CI o RUC del titular. */
  ruc: process.env.NEXT_PUBLIC_BANK_RUC ?? "",
  /** Alias de transferencia. */
  alias: process.env.NEXT_PUBLIC_BANK_ALIAS ?? "",
};
