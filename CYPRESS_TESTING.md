# Pruebas Funcionales con Cypress - InduKitchen

## 📋 Tabla de Contenidos

- [Descripción](#descripción)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Instalación](#instalación)
- [Ejecución de Pruebas](#ejecución-de-pruebas)
- [Estructura de Pruebas](#estructura-de-pruebas)
- [Cobertura de Código](#cobertura-de-código)
- [Casos de Prueba](#casos-de-prueba)
- [Reportes](#reportes)
- [Mejores Prácticas](#mejores-prácticas)

## 📝 Descripción

Este proyecto implementa pruebas funcionales end-to-end (E2E) completas utilizando Cypress para la aplicación InduKitchen. Las pruebas cubren todos los flujos principales de la aplicación con aserciones robustas y cobertura de código.

## 🛠 Tecnologías Utilizadas

- **Cypress**: Framework de pruebas E2E moderno
- **@cypress/code-coverage**: Plugin para generar reportes de cobertura
- **Istanbul/NYC**: Herramientas de instrumentación de código
- **TypeScript**: Lenguaje para escribir las pruebas
- **start-server-and-test**: Utilidad para automatizar inicio del servidor

## 📦 Instalación

Las dependencias ya están instaladas. Si necesitas reinstalarlas:

```bash
npm install
```

### Dependencias de Pruebas

```json
{
  "cypress": "^13.x",
  "@cypress/code-coverage": "^3.x",
  "babel-plugin-istanbul": "^6.x",
  "nyc": "^15.x",
  "start-server-and-test": "^2.x"
}
```

## 🚀 Ejecución de Pruebas

### Modo Interactivo (Recomendado para desarrollo)

```bash
# Opción 1: Iniciar servidor y Cypress manualmente
npm start
# En otra terminal:
npm run cypress

# Opción 2: Automatizado
npm run e2e:open
```

### Modo Headless (Recomendado para CI/CD)

```bash
# Ejecutar todas las pruebas
npm run e2e

# Ejecutar en navegador específico
npm run cypress:run:chrome
npm run cypress:run:firefox

# Solo Cypress sin servidor
npm run cypress:run
```

### Pruebas con Cobertura

```bash
# Ejecutar pruebas y generar reporte de cobertura
npm run cypress:coverage
```

## 📁 Estructura de Pruebas

```
cypress/
├── e2e/                          # Archivos de pruebas
│   ├── auth.cy.ts               # Autenticación y seguridad
│   ├── products.cy.ts           # Productos y catálogo
│   ├── cart.cy.ts               # Carrito de compras
│   └── admin.cy.ts              # Panel de administración
├── support/                      # Configuración y comandos
│   ├── e2e.ts                   # Setup global y comandos personalizados
│   └── commands.ts              # Comandos reutilizables
└── fixtures/                     # Datos de prueba (opcional)
```

## 🧪 Casos de Prueba

### 1. Autenticación (auth.cy.ts)

#### ✅ Login
- Carga correcta de la página de login
- Validación de credenciales inválidas
- Validación de formato de email
- Validación de campos obligatorios
- Login exitoso con credenciales válidas
- Enlace a registro funcional

#### ✅ Registro
- Carga correcta del formulario
- Validación de campos obligatorios
- Validación de coincidencia de contraseñas
- Registro exitoso de nuevo usuario
- Enlace a login funcional

#### ✅ Protección de Rutas
- Redirección a login sin autenticación
- Acceso permitido a páginas públicas
- Cierre de sesión correcto

**Total: ~15 pruebas**

### 2. Productos (products.cy.ts)

#### ✅ Listado de Productos
- Carga correcta del listado
- Información visible de productos (imagen, nombre, precio)
- Búsqueda de productos
- Filtrado por categorías
- Paginación funcional
- Navegación a detalle

#### ✅ Detalle de Producto
- Información completa del producto
- Selector de cantidad funcional
- Validación de cantidad mínima
- Agregar producto al carrito
- Actualización del contador del carrito
- Navegación de regreso al listado

#### ✅ Imágenes y Responsividad
- Carga correcta de imágenes
- Atributos alt en imágenes
- Vista móvil, tablet y desktop

**Total: ~25 pruebas**

### 3. Carrito (cart.cy.ts)

#### ✅ Funcionalidad Básica
- Carrito vacío inicial
- Agregar productos desde detalle
- Información correcta en el carrito
- Cantidad correcta de productos

#### ✅ Modificación de Productos
- Aumentar cantidad
- Disminuir cantidad
- Eliminar productos
- Actualización de subtotales

#### ✅ Cálculo de Totales
- Subtotal correcto
- Total a pagar
- Cálculo con múltiples productos

#### ✅ Proceso de Compra
- Botón de checkout visible
- Requerimiento de autenticación
- Validación de flujo completo

#### ✅ Persistencia
- Mantener productos al navegar
- Persistencia al recargar página
- Funcionalidad de vaciar carrito

**Total: ~30 pruebas**

### 4. Administración (admin.cy.ts)

#### ✅ Acceso y Seguridad
- Redirección sin autenticación
- Login como administrador
- Bloqueo a usuarios normales
- Cierre de sesión seguro

#### ✅ Gestión de Productos
- Listado de productos
- Crear nuevo producto
- Editar producto existente
- Eliminar producto
- Búsqueda de productos
- Validaciones de formulario

#### ✅ Gestión de Clientes
- Listado de clientes
- Crear nuevo cliente
- Editar información
- Eliminar cliente
- Historial de compras

#### ✅ Gestión de Facturas
- Listado de facturas
- Detalle de facturas
- Filtrado por estado
- Actualización de estado
- Búsqueda por cliente
- Cálculo de totales

#### ✅ Dashboard
- Métricas del negocio
- Estadísticas clave
- Responsividad del panel

**Total: ~40 pruebas**

## 📊 Cobertura de Código

### Visualizar Reportes

```bash
# Ejecutar pruebas con cobertura
npm run cypress:coverage

# Los reportes se generan en:
# - coverage-cypress/       # Reporte HTML
# - coverage-cypress/lcov.info  # Para SonarQube
```

### Abrir Reporte HTML

```bash
# macOS
open coverage-cypress/index.html

# Linux
xdg-open coverage-cypress/index.html

# Windows
start coverage-cypress/index.html
```

### Métricas de Cobertura

El proyecto busca mantener:

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Archivos Excluidos de Cobertura

```json
{
  "exclude": [
    "**/*.spec.ts",
    "**/*.e2e.js",
    "**/environments/**",
    "**/node_modules/**",
    "cypress/**"
  ]
}
```

## 📈 Reportes

### Reportes Generados

1. **Video de Pruebas**: `cypress/videos/`
2. **Screenshots de Errores**: `cypress/screenshots/`
3. **Reporte de Cobertura HTML**: `coverage-cypress/index.html`
4. **Reporte LCOV**: `coverage-cypress/lcov.info`
5. **Reporte JSON**: `coverage-cypress/coverage-final.json`

### Integración con CI/CD

```yaml
# Ejemplo para GitHub Actions
- name: Run E2E Tests
  run: npm run e2e

- name: Generate Coverage
  run: npm run cypress:coverage

- name: Upload Coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage-cypress/lcov.info
```

## 🎯 Mejores Prácticas Implementadas

### 1. Comandos Personalizados

```typescript
// Uso de comandos reutilizables
cy.login('user@example.com', 'password');
cy.loginAsAdmin();
cy.addProductToCart(1, 2);
cy.clearCart();
```

### 2. Selectores Robustos

```typescript
// Preferir data-testid
cy.get('[data-testid="product-item"]')

// Alternativas semánticas
cy.contains('button', /agregar|add/i)
```

### 3. Esperas Inteligentes

```typescript
// Cypress espera automáticamente
cy.get('.product').should('be.visible')

// Timeouts personalizados cuando es necesario
cy.contains(/success/i, { timeout: 10000 })
```

### 4. Aserciones Múltiples

```typescript
cy.get('input[type="email"]')
  .should('be.visible')
  .and('have.attr', 'required')
  .and('not.be.disabled')
```

### 5. Limpieza de Estado

```typescript
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
});
```

### 6. Manejo de Casos Edge

```typescript
// Verificar existencia antes de interactuar
cy.get('body').then(($body) => {
  if ($body.find('.modal').length > 0) {
    cy.contains('button', /cerrar/i).click();
  }
});
```

## 🔧 Configuración Avanzada

### Cypress.config.ts

```typescript
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
  }
});
```

### Variables de Entorno

Crear archivo `cypress.env.json`:

```json
{
  "adminEmail": "admin@indukitchen.com",
  "adminPassword": "admin123",
  "apiUrl": "http://localhost:3000/api"
}
```

Uso:

```typescript
cy.get('input[type="email"]').type(Cypress.env('adminEmail'));
```

## 🐛 Debugging

### Modo Interactivo

```bash
npm run cypress
```

- Ver la aplicación en tiempo real
- Time travel entre comandos
- Inspeccionar DOM en cada paso
- Ver logs de red

### Comandos de Debug

```typescript
// Pausar ejecución
cy.pause()

// Log de debug
cy.log('Verificando productos...')

// Debug en consola
cy.get('.product').then(console.log)

// Screenshot manual
cy.screenshot('estado-actual')
```

## 📞 Soporte

Para problemas o preguntas:

1. Revisar la [documentación de Cypress](https://docs.cypress.io)
2. Ver ejemplos en `cypress/e2e/`
3. Consultar logs en consola con `npm run cypress:run`

## 🎓 Recursos Adicionales

- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress Real World App](https://github.com/cypress-io/cypress-realworld-app)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

## 📝 Checklist de Calidad

- [x] Pruebas de autenticación y seguridad
- [x] Pruebas de flujo de usuario completo
- [x] Pruebas de CRUD en administración
- [x] Validaciones de formularios
- [x] Manejo de errores
- [x] Responsividad en múltiples dispositivos
- [x] Cobertura de código > 70%
- [x] Aserciones robustas y descriptivas
- [x] Comandos reutilizables
- [x] Documentación completa

---

## 🎉 ¡Listo para usar!

Ejecuta tus primeras pruebas:

```bash
npm run e2e:open
```

¡Las pruebas están configuradas y listas para garantizar la calidad de InduKitchen! 🚀
