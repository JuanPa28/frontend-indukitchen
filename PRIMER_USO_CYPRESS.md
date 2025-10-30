# 🚀 PRIMER USO - Guía de Inicio Rápido para Cypress

## ¡Bienvenido! 👋

Esta guía te ayudará a ejecutar tus primeras pruebas con Cypress en menos de 5 minutos.

---

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener:

- ✅ Node.js 18 o superior
- ✅ Dependencias instaladas (`npm install` ya ejecutado)
- ✅ Puerto 4200 disponible

---

## 🎯 Opción 1: Modo Interactivo (RECOMENDADO)

### Paso 1: Iniciar el servidor Angular

```bash
npm start
```

Espera a que veas:
```
✔ Browser application bundle generation complete.
** Angular Live Development Server is listening on localhost:4200
```

### Paso 2: Abrir Cypress (en otra terminal)

```bash
npm run cypress
```

O usa el script helper:
```bash
./cypress-helper.sh
# Selecciona opción 1
```

### Paso 3: Ejecutar tu primera prueba

1. Se abrirá la interfaz de Cypress
2. Haz clic en "E2E Testing"
3. Selecciona un navegador (Chrome recomendado)
4. Haz clic en cualquier archivo `.cy.ts`:
   - `auth.cy.ts` - Pruebas de autenticación
   - `products.cy.ts` - Pruebas de productos
   - `cart.cy.ts` - Pruebas de carrito
   - `admin.cy.ts` - Pruebas de admin

5. ¡Observa cómo se ejecutan las pruebas! 🎬

### Características del Modo Interactivo

- ✅ Ves la aplicación en tiempo real
- ✅ Puedes pausar y reanudar
- ✅ Time-travel entre pasos
- ✅ Inspeccionar DOM en cualquier momento
- ✅ Ver logs de red

---

## 🏃 Opción 2: Ejecutar Todas las Pruebas (Headless)

### Opción A: Con servidor automático

```bash
npm run e2e
```

Este comando:
1. Inicia el servidor Angular
2. Espera a que esté listo
3. Ejecuta todas las pruebas
4. Detiene el servidor

### Opción B: Sin servidor automático

```bash
# Terminal 1: Iniciar servidor
npm start

# Terminal 2: Ejecutar pruebas
npm run cypress:run
```

---

## 📊 Opción 3: Con Cobertura de Código

```bash
npm run cypress:coverage
```

Después de la ejecución:

```bash
# macOS
open coverage-cypress/index.html

# Linux
xdg-open coverage-cypress/index.html

# Windows
start coverage-cypress/index.html
```

---

## 🎨 Usando el Script Helper

```bash
./cypress-helper.sh
```

Verás un menú interactivo:

```
🚀 Cypress Testing Helper - InduKitchen
========================================

Selecciona una opción:

1) Abrir Cypress en modo interactivo
2) Ejecutar todas las pruebas (headless)
3) Ejecutar pruebas con cobertura
4) Ejecutar solo pruebas de autenticación
5) Ejecutar solo pruebas de productos
6) Ejecutar solo pruebas de carrito
7) Ejecutar solo pruebas de admin
8) Ver reporte de cobertura
9) Limpiar archivos de prueba
10) Verificar instalación
0) Salir

Opción: 
```

---

## 📹 ¿Qué Esperar?

### Modo Interactivo
- Ventana del navegador con la aplicación
- Panel lateral de Cypress con comandos
- Logs en tiempo real
- Capturas del DOM en cada paso

### Modo Headless
- Output en terminal con progreso
- Videos generados en `cypress/videos/`
- Screenshots de errores en `cypress/screenshots/`
- Resumen al final:
  ```
  ✔  All specs passed!                      00:45

  ┌────────────────────────────────────────┐
  │ Tests:        130                       │
  │ Passing:      130                       │
  │ Failing:      0                         │
  │ Duration:     45 seconds                │
  └────────────────────────────────────────┘
  ```

---

## 🐛 Problemas Comunes

### Puerto 4200 ya está en uso

```bash
# Detener proceso en puerto 4200
lsof -ti:4200 | xargs kill -9
```

### Cypress no se instala correctamente

```bash
# Limpiar caché y reinstalar
npx cypress cache clear
rm -rf node_modules package-lock.json
npm install
```

### Error de permisos en script helper

```bash
chmod +x cypress-helper.sh
```

### Las pruebas fallan por timeout

- Asegúrate de que el servidor esté corriendo en `http://localhost:4200`
- Verifica que no haya errores en la aplicación Angular
- Aumenta los timeouts en `cypress.config.ts` si tu máquina es lenta

### Browser no se abre

```bash
# Verificar instalación de Cypress
npx cypress verify

# Reinstalar si es necesario
npx cypress install --force
```

---

## 📂 Archivos Generados

Después de ejecutar las pruebas, encontrarás:

```
cypress/
├── videos/              ← Videos de cada spec
│   ├── auth.cy.ts.mp4
│   ├── products.cy.ts.mp4
│   └── ...
│
├── screenshots/         ← Screenshots de errores
│   └── cart.cy.ts/
│       └── error-screenshot.png
│
coverage-cypress/        ← Reporte de cobertura
├── index.html          ← Abrir este archivo
├── lcov.info
└── lcov-report/
```

---

## 🎓 Próximos Pasos

Una vez que hayas ejecutado tus primeras pruebas:

1. **Explora la documentación completa**
   ```bash
   # Ver documentación
   cat CYPRESS_TESTING.md
   ```

2. **Aprende a escribir pruebas**
   ```bash
   # Ver ejemplos
   cat EJEMPLOS_CYPRESS.md
   ```

3. **Personaliza las pruebas**
   - Edita archivos en `cypress/e2e/`
   - Agrega tus propias pruebas
   - Usa los comandos personalizados

4. **Integra con CI/CD**
   - Las pruebas están listas para GitHub Actions
   - Jenkins, GitLab CI, etc.

---

## 📊 Verificar que Todo Funciona

### Checklist Rápido

```bash
# 1. Verificar Node.js
node --version
# Debe mostrar: v18.x o superior

# 2. Verificar npm
npm --version
# Debe mostrar: 9.x o superior

# 3. Verificar Cypress
npx cypress version
# Debe mostrar versión de Cypress

# 4. Listar pruebas
ls cypress/e2e/
# Debe mostrar: auth.cy.ts, products.cy.ts, cart.cy.ts, etc.

# 5. Verificar configuración
cat cypress.config.ts
# Debe mostrar configuración completa
```

---

## 🎯 Comandos para Copiar y Pegar

### Ejecución Básica

```bash
# Iniciar servidor
npm start

# En otra terminal: Modo interactivo
npm run cypress

# O todo en uno
npm run e2e:open
```

### Ejecución Completa

```bash
# Todas las pruebas + servidor automático
npm run e2e

# Con cobertura
npm run cypress:coverage
```

### Pruebas Individuales

```bash
# Solo autenticación
npx cypress run --spec "cypress/e2e/auth.cy.ts"

# Solo productos
npx cypress run --spec "cypress/e2e/products.cy.ts"

# Solo carrito
npx cypress run --spec "cypress/e2e/cart.cy.ts"

# Solo admin
npx cypress run --spec "cypress/e2e/admin.cy.ts"
```

---

## 🌟 Tips para Principiantes

### En Modo Interactivo

1. **Usa el Time Travel**
   - Pasa el mouse sobre los comandos en el panel
   - Ve cómo se veía la aplicación en ese paso

2. **Inspecciona el DOM**
   - Haz clic en comandos `.get()` 
   - Ve qué elemento se seleccionó

3. **Abre la Consola**
   - Usa Chrome DevTools normalmente
   - Ve logs de red, errores, etc.

4. **Ejecuta Comandos Manualmente**
   - Abre la consola del navegador
   - Prueba selectores: `Cypress.$('.product-card')`

### En Modo Headless

1. **Ve los Videos**
   - Muy útil para entender fallos
   - Ubicados en `cypress/videos/`

2. **Revisa Screenshots**
   - Solo se generan en errores
   - Muestran el estado exacto del fallo

3. **Lee los Logs Completos**
   - El terminal muestra cada paso
   - Busca errores en rojo

---

## 🆘 Ayuda Adicional

### Documentación

- 📖 [Documentación Completa](CYPRESS_TESTING.md)
- 🚀 [Quick Start](cypress/README.md)
- 💡 [Ejemplos](EJEMPLOS_CYPRESS.md)
- 📊 [Resumen](RESUMEN_PRUEBAS_CYPRESS.md)
- 🎯 [Presentación](PRESENTACION_CYPRESS.md)

### Recursos Online

- 🌐 [Cypress Docs](https://docs.cypress.io)
- 📺 [Cypress YouTube](https://www.youtube.com/c/Cypressio)
- 💬 [Cypress Discord](https://discord.gg/cypress)

### Comandos de Debug

```bash
# Ver información de Cypress
npx cypress info

# Verificar instalación
npx cypress verify

# Abrir configuración
cat cypress.config.ts

# Ver comandos personalizados
cat cypress/support/e2e.ts
```

---

## ✅ Todo Listo!

Ahora estás listo para:

1. ✅ Ejecutar pruebas en modo interactivo
2. ✅ Ejecutar todas las pruebas automáticamente
3. ✅ Ver reportes de cobertura
4. ✅ Entender los resultados
5. ✅ Escribir tus propias pruebas

### 🎉 ¡Ejecuta tu primera prueba ahora!

```bash
npm run e2e:open
```

---

**¿Preguntas?** Revisa la [documentación completa](CYPRESS_TESTING.md) o los [ejemplos prácticos](EJEMPLOS_CYPRESS.md).

**¡Feliz testing!** 🧪✨
