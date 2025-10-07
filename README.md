# Frontend InduKitchen

Aplicación frontend desarrollada con Angular 20. Incluye componentes para login, registro y listado de productos, además de servicios para autenticación y consumo de un backend de productos.

## Stack principal

- Angular 20 (CLI)
- TypeScript
- Firebase Authentication (login)
- Karma + Jasmine para pruebas unitarias
- SonarQube / SonarCloud para análisis estático y cobertura

## Estructura del repositorio

- `src/` — código fuente Angular
- `src/app/components/` — componentes: login, register, product-list, etc.
- `src/app/services/` — servicios: auth, product, cart
- `coverage/` — artefactos de cobertura generados por Karma
- `sonar-project.properties` — configuración base para SonarQube

## Instalación y ejecución

1. Instalar dependencias:

   ```powershell
   npm install
   ```

2. Levantar el servidor de desarrollo:

   ```powershell
   ng serve
   ```

3. Abrir [http://localhost:4200/](http://localhost:4200/) en el navegador.

## Pruebas unitarias

```powershell
# Modo desarrollo (watch)
ng test

# Ejecución única (CI/local)
ng test --watch=false
```

## Cobertura

```powershell
ng test --watch=false
# luego abrir coverage/frontend-indukitchen/index.html
```

## Pruebas y técnicas utilizadas

- Dobles de prueba con `jasmine.createSpyObj` en servicios (p.ej. `ClienteService`, `ProductoService`, `FacturaService`, `CarritoService`, `SuggestionService`, `LocalCartService`) como en:
  - [`src/app/components/admin/admin.component.spec.ts`](src/app/components/admin/admin.component.spec.ts)
  - [`src/app/components/ai-chat/ai-chat.component.spec.ts`](src/app/components/ai-chat/ai-chat.component.spec.ts)
- Control de asincronía:
  - `fakeAsync` + `tick` para orquestar Promesas/Timers y flujos RxJS.
  - Uso de `Subject` y `of`/`throwError` para simular emisiones y errores.
- Pruebas de UI y utilidades:
  - Paginación, truncado de texto, y manejo de imágenes de respaldo en [`src/app/components/product-list/product-list.component.spec.ts`](src/app/components/product-list/product-list.component.spec.ts).
  - Toasts/avisos programáticos y handlers de errores.
  - Funciones `trackBy*` y toggles de UI en [`src/app/components/admin/admin.component.spec.ts`](src/app/components/admin/admin.component.spec.ts).
- Mapeo de errores HTTP a mensajes de negocio (404/409/500) cubierto en [`src/app/components/admin/admin.component.spec.ts`](src/app/components/admin/admin.component.spec.ts).
- Cálculo de totales del dashboard con `forkJoin` + `switchMap` y fallback robusto, probado en [`src/app/components/admin/admin.component.spec.ts`](src/app/components/admin/admin.component.spec.ts).
- Helpers de aserciones encadenables para mensajes del chat en [`src/app/components/ai-chat/ai-chat.component.spec.ts`](src/app/components/ai-chat/ai-chat.component.spec.ts).

### Archivos de tests relevantes

- [`src/app/app.component.spec.ts`](src/app/app.component.spec.ts) — auth state y logout
- [`src/app/components/admin/admin.component.spec.ts`](src/app/components/admin/admin.component.spec.ts) — dashboard, CRUD, errores y helpers
- [`src/app/components/product-list/product-list.component.spec.ts`](src/app/components/product-list/product-list.component.spec.ts) — productos, filtros, paginación
- [`src/app/components/register/register.component.spec.ts`](src/app/components/register/register.component.spec.ts) — validaciones y registro
- [`src/app/components/ai-chat/ai-chat.component.spec.ts`](src/app/components/ai-chat/ai-chat.component.spec.ts) — chat, sugerencias y carrito
- [`src/app/components/detail/detail.component.spec.ts`](src/app/components/detail/detail.component.spec.ts) — cantidades y eventos

## Integración con SonarQube / SonarCloud

Configuración básica en `sonar-project.properties`:

```properties
sonar.projectKey=frontend-indukitchen
sonar.sources=src
sonar.tests=src
sonar.javascript.lcov.reportPaths=coverage/frontend-indukitchen/lcov.info
sonar.scm.provider=git
```

Ejemplo de ejecución:

```powershell
# SonarScanner instalado
sonar-scanner -Dsonar.projectKey=frontend-indukitchen -Dsonar.sources=src -Dsonar.tests=src -Dsonar.javascript.lcov.reportPaths=coverage/frontend-indukitchen/lcov.info

# Docker
docker run --rm -e SONAR_HOST_URL="https://sonarcloud.io" -e SONAR_TOKEN="<TOKEN>" -v "%cd%":/usr/src sonarsource/sonar-scanner-cli
```

## Nota sobre "Missing blame information"

SonarQube requiere `git blame` para asignar autores. Si aparecen advertencias:

- En CI usar `actions/checkout` con `fetch-depth: 0`.
- Ejecutar el scanner en la raíz del repositorio (donde está `.git`).
- Verificar que `git` esté instalado en el runner.

## Detalles del proyecto

- Autenticación: login con correo/contraseña y soporte para providers vía Firebase Authentication.
- Visualización de productos: listado con búsqueda, filtros, paginación y detalles.
- Carrito de compras: agregar, eliminar y ver total; la factura se genera en el backend.
- Chat con IA: integración cliente-side hacia un servicio de IA en el backend (ej. GPT).

## Cobertura destacada (local)

- [`src/app/components/login/login.component.ts`](src/app/components/login/login.component.ts) — alta cobertura
- [`src/app/components/product-list/product-list.component.ts`](src/app/components/product-list/product-list.component.ts) — alta cobertura
- [`src/app/components/register/register.component.ts`](src/app/components/register/register.component.ts) — alta cobertura
- [`src/app/components/admin/admin.component.ts`](src/app/components/admin/admin.component.ts) — alta cobertura
- [`src/app/admin.guard.ts`](src/app/admin.guard.ts) — alta cobertura

## Diseño de pruebas (resumen)

- Cobertura de rutas críticas, manejo de errores y comportamientos UI sin depender de un backend real.
- Mocking: uso de spies/objetos mock en lugar de llamadas de red (ej. `spyOn(productoService, 'getAll').and.returnValue(of(mockProducts))`).
- Pruebas asíncronas: `fakeAsync` + `tick` para controlar promesas y timers.
- Autenticación: mocks de `Auth` y navegación para verificar flujos (ver [`src/app/app.component.spec.ts`](src/app/app.component.spec.ts)).

---

Hecho con Angular — Frontend InduKitchen

© 2025 InduKitchen. Todos los derechos reservados.
