# Roadmap Ecommerce Paraguay (Niez Store)

## Repositorio: 1 o 2?

Recomendacion para tu caso actual: **quedarte en este mismo repo** por ahora.

Motivo:
- Ya tienes el frontend funcionando y en iteracion activa.
- Integrar checkout + pedidos + Bancard sera mas rapido en un monorepo.
- Menos complejidad de despliegue, versionado y sincronizacion front/back.

Cuando separar en 2 repos:
- Si el backend empieza a servir mas de 1 frontend (web, app, POS).
- Si tendras equipos separados por frontend/backend.
- Si el backend necesita ciclos de despliegue totalmente independientes.

## Arquitectura recomendada (ahora)

- Mantener `niezstore` como monorepo (Next.js + API routes/backend interno).
- Base de datos relacional (PostgreSQL recomendado).
- Modulos internos:
  - `catalog`
  - `cart`
  - `checkout`
  - `orders`
  - `payments` (Bancard)
  - `admin`

## Sprint 1 (Base operativa)

1. Modelo de datos real: `users`, `products`, `product_variants`, `categories`, `orders`, `order_items`, `payments`, `addresses`.
2. Auth basica (registro/login/logout) + roles (`admin`, `customer`).
3. Admin minimo: CRUD de categorias, productos y stock.
4. Migrar frontend para consumir DB (quitar dependencia de dummy-data para flujo principal).

## Sprint 2 (Compra completa)

1. Carrito persistente (invitado + usuario logueado).
2. Checkout: datos de cliente, direccion, metodo de envio, resumen.
3. Crear orden en backend con estado `pending_payment`.
4. Validaciones de negocio: stock, precios, IVA y envio.

## Sprint 3 (Bancard)

1. Endpoint para iniciar transaccion Bancard.
2. Webhook Bancard para confirmacion/fallo (idempotente).
3. Actualizacion automatica de estados:
   - pago: `pending`, `approved`, `failed`, `refunded`
   - pedido: `pending_payment`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`
4. Pantallas de resultado: exito, pendiente, rechazo.
5. Historial de pedidos en cuenta del usuario.

## Sprint 4 (Cierre comercial)

1. Correos transaccionales: confirmacion de pedido/pago/cambios de estado.
2. Reembolsos/cancelaciones desde admin.
3. Reportes basicos: ventas, ticket promedio, pedidos por estado.
4. Logging y manejo de errores para pagos/webhooks.
5. QA E2E: flujo completo desde producto hasta pago confirmado.

## Extras criticos para Paraguay (no olvidar)

1. Moneda `PYG` en todo el flujo.
2. Campos fiscales: cedula/RUC segun tipo de cliente.
3. Reglas de IVA y comprobante/factura segun normativa local.
4. Politicas claras de devoluciones y terminos.
5. Seguridad: rate limiting, validacion estricta de payloads, secretos por entorno.

## Que agregaria despues (v2)

1. Cupones y promociones.
2. Wishlist.
3. Reseñas.
4. Recuperacion de carrito abandonado.
5. Dashboard mas completo de analitica.

## Decision final sugerida

- **Seguir en este repo ahora**.
- Separar backend a otro repo recien cuando haya necesidad real de escalar equipo o consumidores.
