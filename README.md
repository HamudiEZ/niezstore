# Niez Store

Ecommerce en Next.js + Prisma + PostgreSQL.

## Requisitos

- Node.js 20+ (recomendado 22+)
- PostgreSQL en local o remoto

## Configuracion rapida

1. Instalar dependencias:

```bash
npm install
```

2. Configurar `DATABASE_URL` en `.env`.

3. Aplicar migraciones:

```bash
npm run prisma:migrate -- --name init
```

4. (Opcional) Sembrar admin:

```bash
npm run prisma:seed
```

5. Iniciar entorno de desarrollo:

```bash
npm run dev
```

## Scripts utiles

- `npm run dev`: servidor local
- `npm run lint`: lint del proyecto
- `npm run build`: build de produccion
- `npm run prisma:generate`: regenerar Prisma Client
- `npm run prisma:migrate`: crear/aplicar migraciones en desarrollo
- `npm run prisma:studio`: explorar DB en Prisma Studio
- `npm run prisma:seed`: ejecutar seed

## Modulo Auth (actual)

- Registro e inicio de sesion con cookie HTTP-only.
- Hash de contrasena con `bcrypt`.
- Compatibilidad temporal con hash legacy SHA-256 (se migra automaticamente al hacer login).
- Rate limit en login (intentos fallidos por IP + email).
- Ruta de recuperacion de contrasena (placeholder UI): `/forgot-password`.
