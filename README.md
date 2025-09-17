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

- Test runner: Karma
- Framework: Jasmine
- Comandos principales:
  ```powershell
  # Modo desarrollo (watch)
  ng test
  # Ejecución única (CI)
  ng test --watch=false
  ```

## Cobertura

- Los reportes se generan en `coverage/frontend-indukitchen/`.
- El archivo `lcov.info` se utiliza para SonarQube.
- Para abrir el reporte HTML localmente:
  ```powershell
  ng test --watch=false
  # luego abrir coverage/frontend-indukitchen/index.html
  ```

## Pruebas y técnicas utilizadas

- Pruebas de componentes con `TestBed` y `createComponent`.
- Mocks de servicios con `jasmine.createSpyObj` o `spyOn`.
- Control de asincronía con `fakeAsync`, `tick` y `flushMicrotasks`.
- Cobertura de manejo de errores, wrappers y guards.

### Archivos de tests relevantes

- `src/app/components/login/login.component.spec.ts` — login y errores
- `src/app/components/product-list/product-list.component.spec.ts` — productos, filtros y paginación
- `src/app/auth.guard.spec.ts` — guard y autenticación

## Integración con SonarQube / SonarCloud

1. Generar el reporte `lcov` con Karma (`karma.conf.js` debe exportar a `coverage/`).
2. Ajustar `sonar-project.properties` si se usa el scanner:
   ```
   sonar.projectKey=frontend-indukitchen
   sonar.sources=src
   sonar.tests=src
   sonar.javascript.lcov.reportPaths=coverage/frontend-indukitchen/lcov.info
   sonar.scm.provider=git
   ```
3. Ejecutar Sonar Scanner localmente o desde CI:
   ```powershell
   # SonarScanner instalado
   sonar-scanner -Dsonar.projectKey=frontend-indukitchen -Dsonar.sources=src -Dsonar.tests=src -Dsonar.javascript.lcov.reportPaths=coverage/frontend-indukitchen/lcov.info
   # Docker
   docker run --rm -e SONAR_HOST_URL="https://sonarcloud.io" -e SONAR_TOKEN="<TOKEN>" -v "%cd%":/usr/src sonarsource/sonar-scanner-cli
   ```

### Nota sobre "Missing blame information"

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

- `src/app/auth.guard.ts` — 100%
- `src/environments/environments.ts` — 100%
- `src/app/components/login/login.component.ts` — 100%
- `src/app/components/product-list/product-list.component.ts` — 100%
- `src/app/components/register/register.component.ts` — 100%

## Diseño de pruebas (resumen)

- Cobertura de rutas críticas, manejo de errores y comportamientos UI sin depender de un backend real.
- Mocking: uso de spies y objetos mock en lugar de llamadas de red (ej. `spyOn(productoService, 'getAll').and.returnValue(of(mockProducts))`).
- Pruebas asíncronas: uso de `fakeAsync` + `flushMicrotasks` + `tick` para controlar promesas y timers.
- Guards: uso de `TestBed.runInInjectionContext` y mocks de `Auth` para simular `onAuthStateChanged`.

---

Hecho con Angular — Frontend InduKitchen

© 2025 InduKitchen. Todos los derechos reservados.
