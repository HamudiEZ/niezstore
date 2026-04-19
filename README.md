# Niez Store

Este es el código fuente de **Niez Store**, una plataforma de e-commerce completa desarrollada con Next.js y Prisma. El objetivo principal de este proyecto es construir una tienda funcional enfocada en buenas prácticas de arquitectura, manejo de estado complejo y resolución de problemas comunes en entornos de producción.

## Tecnologías Principales

- **Framework:** Next.js 16 (App Router, Server Actions)
- **Base de Datos:** PostgreSQL con **Prisma ORM**
- **Estado Global:** Zustand (implementado para el carrito y los favoritos)
- **Estilos:** Tailwind CSS (diseño fluido con variables CSS nativas para soporte transparente de Dark/Light mode)
- **Imágenes:** Integración directa con la API de Cloudinary.
- **Autenticación:** Sistema propio utilizando Bcrypt y cookies seguras HTTP-only para mayor control sobre la capa de seguridad.

## Características Destacadas

Este proyecto evade enfoques básicos e implementa soluciones para escenarios reales de e-commerce:

1. **Protección contra Datos Obsoletos (Stale Data):**
   Uno de los retos al persistir un carrito en el `LocalStorage` es que el usuario puede regresar días después con precios o stock que ya no son válidos. Para solucionar esto sin borrar el carrito, se implementó un sistema de "Rehidratación en Background". Al iniciar la aplicación, Zustand carga los datos y realiza una consulta simultánea (`/api/products/batch`) para calibrar los precios reales desde el servidor en pocos milisegundos, garantizando integridad antes del cobro.

2. **Panel de Administración Modular (Micro Front-Ends):**
   Manejar categorías, productos, variantes y estadísticas en un solo componente puede resultar en código inmanejable. El panel de administración fue refactorizado aislando cada dominio en su propio componente contenedor. Cada pestaña (Categorías, Productos, Dashboard) gestiona su propio estado y datos, respetando el principio de responsabilidad única.

3. **Inventario Robusto:**
   El carrito de compras emplea validaciones transaccionales (`$transaction` de Prisma). Esto elimina condiciones de carrera (Race Conditions) y evita conflictos de concurrencia de stock al procesar pagos simultáneos.

## Configuración Local

Para levantar el entorno completo en tu máquina:

1. **Instalar las dependencias:**
   ```bash
   npm install
   ```

2. **Configurar las variables de entorno:**
   Renombra o copia el archivo `.env.example` a `.env` y asigna tus propias credenciales para PostgreSQL (`DATABASE_URL`) y Cloudinary.

3. **Ejecutar las migraciones:**
   ```bash
   npm run prisma:migrate -- --name init
   ```

4. **Cargar la base de datos (Seed):**
   Este paso genera un usuario administrador por defecto y un catálogo de productos de muestra.
   ```bash
   npm run prisma:seed
   ```

5. **Iniciar el servidor:**
   ```bash
   npm run dev
   ```

Cualquier consulta sobre la implementación puede ser revisada en el código fuente o creando un issue en el repositorio.
