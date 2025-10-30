# 📚 Guía de Ejemplos - Cómo Escribir Pruebas en Cypress

## 🎯 Plantillas y Ejemplos Prácticos

Esta guía contiene ejemplos prácticos de cómo escribir diferentes tipos de pruebas en Cypress para el proyecto InduKitchen.

---

## 1️⃣ Estructura Básica de una Prueba

```typescript
/// <reference types="cypress" />

describe('Nombre del módulo a probar', () => {
  beforeEach(() => {
    // Configuración antes de cada prueba
    cy.clearLocalStorage();
    cy.visit('/ruta');
  });

  it('Debe hacer algo específico', () => {
    // Arrange (Preparar)
    cy.get('selector').should('exist');
    
    // Act (Actuar)
    cy.get('button').click();
    
    // Assert (Verificar)
    cy.url().should('include', '/resultado');
  });
});
```

---

## 2️⃣ Ejemplos de Selectores

### ✅ Selectores Recomendados

```typescript
// Por data-testid (MEJOR OPCIÓN)
cy.get('[data-testid="product-item"]')

// Por clase específica
cy.get('.product-card')

// Por tipo y atributo
cy.get('input[type="email"]')

// Por texto visible
cy.contains('Agregar al carrito')

// Por texto con regex
cy.contains(/agregar|añadir/i)

// Por rol ARIA
cy.get('[role="button"]')
```

### ❌ Selectores a Evitar

```typescript
// Evitar selectores frágiles
cy.get('div > div > span')  // ❌ Muy específico
cy.get('.btn-primary')      // ❌ Puede cambiar con estilos
cy.get('#button1')          // ❌ IDs autogenerados
```

---

## 3️⃣ Ejemplos de Aserciones

### Aserciones de Visibilidad

```typescript
// Elemento visible
cy.get('.product').should('be.visible')

// Elemento oculto
cy.get('.error-message').should('not.be.visible')

// Elemento existe en el DOM
cy.get('.modal').should('exist')

// Elemento NO existe
cy.get('.spinner').should('not.exist')
```

### Aserciones de Contenido

```typescript
// Contiene texto
cy.get('h1').should('contain', 'Bienvenido')

// Contiene texto exacto
cy.get('.price').should('have.text', '$99.99')

// Tiene valor en input
cy.get('input[name="email"]').should('have.value', 'user@test.com')

// Tiene atributo
cy.get('img').should('have.attr', 'alt')

// Atributo con valor específico
cy.get('img').should('have.attr', 'src', '/images/product.jpg')
```

### Aserciones de Estado

```typescript
// Input deshabilitado
cy.get('button').should('be.disabled')

// Input habilitado
cy.get('input').should('not.be.disabled')

// Checkbox marcado
cy.get('input[type="checkbox"]').should('be.checked')

// Campo inválido
cy.get('input:invalid').should('exist')
```

### Aserciones de Colecciones

```typescript
// Cantidad de elementos
cy.get('.product-card').should('have.length', 10)

// Al menos N elementos
cy.get('.product-card').should('have.length.at.least', 1)

// Máximo N elementos
cy.get('.error').should('have.length.at.most', 3)
```

### Aserciones de URL

```typescript
// URL incluye texto
cy.url().should('include', '/products')

// URL exacta
cy.url().should('eq', 'http://localhost:4200/cart')

// URL no incluye
cy.url().should('not.include', '/login')
```

### Aserciones con Funciones

```typescript
// Satisface condición
cy.url().should('satisfy', (url) => {
  return url.includes('/cart') || url.includes('/checkout');
});

// Múltiples condiciones
cy.get('.product').should(($el) => {
  expect($el).to.have.length(3);
  expect($el.eq(0)).to.contain('Producto 1');
  expect($el).to.have.class('active');
});
```

---

## 4️⃣ Interacciones con Elementos

### Clicks

```typescript
// Click simple
cy.get('button').click()

// Click forzado (bypass de verificaciones)
cy.get('button').click({ force: true })

// Click en posición específica
cy.get('.canvas').click(100, 200)

// Doble click
cy.get('.item').dblclick()

// Click derecho
cy.get('.item').rightclick()
```

### Input de Texto

```typescript
// Escribir texto
cy.get('input').type('Hola mundo')

// Limpiar y escribir
cy.get('input').clear().type('Nuevo texto')

// Escribir con teclas especiales
cy.get('input').type('usuario@test.com{enter}')

// Teclas especiales disponibles
cy.get('input').type('{selectAll}{backspace}')
cy.get('input').type('{ctrl}A')
cy.get('input').type('{shift}{alt}T')
```

### Selects y Checkboxes

```typescript
// Select por valor
cy.get('select').select('opcion1')

// Select por texto visible
cy.get('select').select('Opción visible')

// Select por índice
cy.get('select').select(2)

// Check checkbox
cy.get('input[type="checkbox"]').check()

// Uncheck checkbox
cy.get('input[type="checkbox"]').uncheck()

// Check múltiples
cy.get('input[type="checkbox"]').check(['value1', 'value2'])
```

### File Upload

```typescript
// Subir archivo
cy.get('input[type="file"]').selectFile('path/to/file.jpg')

// Subir desde fixtures
cy.get('input[type="file"]').selectFile('cypress/fixtures/image.jpg')

// Drag and drop
cy.get('input[type="file"]').selectFile('file.jpg', { action: 'drag-drop' })
```

---

## 5️⃣ Navegación

```typescript
// Visitar URL
cy.visit('/products')

// URL completa
cy.visit('http://localhost:4200/cart')

// Navegar atrás
cy.go('back')

// Navegar adelante
cy.go('forward')

// Recargar página
cy.reload()

// Recargar sin caché
cy.reload(true)
```

---

## 6️⃣ Esperas y Timeouts

```typescript
// Espera explícita (NO RECOMENDADO)
cy.wait(1000)  // Evitar si es posible

// Esperar por elemento (MEJOR)
cy.get('.product', { timeout: 10000 }).should('be.visible')

// Esperar por request
cy.intercept('GET', '/api/products').as('getProducts')
cy.visit('/products')
cy.wait('@getProducts')

// Esperar múltiples requests
cy.wait(['@getProducts', '@getCategories'])

// Esperar condición personalizada
cy.get('.counter').should(($el) => {
  expect(parseInt($el.text())).to.be.greaterThan(0)
})
```

---

## 7️⃣ Manejo de Requests HTTP

```typescript
// Interceptar GET
cy.intercept('GET', '/api/products').as('getProducts')
cy.visit('/products')
cy.wait('@getProducts').then((interception) => {
  expect(interception.response.statusCode).to.eq(200)
  expect(interception.response.body).to.have.length.gt(0)
})

// Interceptar POST
cy.intercept('POST', '/api/cart').as('addToCart')
cy.get('button').click()
cy.wait('@addToCart')

// Mock de respuesta
cy.intercept('GET', '/api/products', {
  statusCode: 200,
  body: [
    { id: 1, name: 'Producto Mock', price: 99.99 }
  ]
})

// Mock de error
cy.intercept('POST', '/api/login', {
  statusCode: 401,
  body: { error: 'Credenciales inválidas' }
})
```

---

## 8️⃣ LocalStorage y Cookies

```typescript
// Limpiar localStorage
cy.clearLocalStorage()

// Limpiar item específico
cy.clearLocalStorage('token')

// Obtener item
cy.window().its('localStorage').invoke('getItem', 'token')
  .should('exist')

// Setear item
cy.window().then((win) => {
  win.localStorage.setItem('theme', 'dark')
})

// Cookies
cy.getCookie('session').should('exist')
cy.setCookie('session', 'abc123')
cy.clearCookie('session')
cy.clearCookies()
```

---

## 9️⃣ Manejo de Alertas y Modals

```typescript
// Alert automático (Cypress acepta automáticamente)
cy.on('window:alert', (text) => {
  expect(text).to.contains('¿Estás seguro?')
})

// Confirm (cancelar)
cy.on('window:confirm', () => false)

// Confirm (aceptar)
cy.on('window:confirm', () => true)

// Modal de Bootstrap/Material
cy.get('.modal').should('be.visible')
cy.get('.modal button').contains('Aceptar').click()
cy.get('.modal').should('not.exist')
```

---

## 🔟 Comandos Avanzados

### Then y Within

```typescript
// Then para usar resultado
cy.get('.product').then(($product) => {
  const price = $product.find('.price').text()
  cy.log(`Precio: ${price}`)
})

// Within para scope
cy.get('.cart-item').first().within(() => {
  cy.get('.quantity').should('have.value', '2')
  cy.get('.price').should('contain', '$')
  cy.get('button').click()
})
```

### Each para Iteraciones

```typescript
// Iterar sobre elementos
cy.get('.product').each(($product, index) => {
  cy.wrap($product).within(() => {
    cy.get('.title').should('not.be.empty')
    cy.get('.price').should('contain', '$')
  })
})
```

### Alias y Reutilización

```typescript
// Crear alias
cy.get('.product').as('products')
cy.get('@products').should('have.length', 10)

// Alias de valores
cy.wrap('mi-valor').as('miVariable')
cy.get('@miVariable').should('eq', 'mi-valor')
```

---

## 1️⃣1️⃣ Ejemplos Completos por Escenario

### Login Completo

```typescript
it('Debe hacer login correctamente', () => {
  // Preparar
  cy.visit('/login')
  cy.url().should('include', '/login')
  
  // Llenar formulario
  cy.get('input[type="email"]')
    .should('be.visible')
    .type('usuario@test.com')
    .should('have.value', 'usuario@test.com')
  
  cy.get('input[type="password"]')
    .type('password123')
  
  // Interceptar request
  cy.intercept('POST', '/api/auth/login').as('loginRequest')
  
  // Enviar
  cy.get('button[type="submit"]').click()
  
  // Verificar request
  cy.wait('@loginRequest').its('response.statusCode').should('eq', 200)
  
  // Verificar redirección
  cy.url().should('not.include', '/login')
  
  // Verificar token
  cy.window().its('localStorage')
    .invoke('getItem', 'token')
    .should('exist')
})
```

### Agregar al Carrito

```typescript
it('Debe agregar producto al carrito', () => {
  // Visitar productos
  cy.visit('/')
  cy.get('.product-card').should('have.length.at.least', 1)
  
  // Guardar nombre del producto
  cy.get('.product-card').first().find('.product-name')
    .invoke('text')
    .as('productName')
  
  // Ir a detalle
  cy.get('.product-card').first().click()
  cy.url().should('include', '/detail')
  
  // Configurar cantidad
  cy.get('input[type="number"]')
    .clear()
    .type('2')
    .should('have.value', '2')
  
  // Interceptar
  cy.intercept('POST', '/api/cart').as('addCart')
  
  // Agregar
  cy.contains('button', /agregar/i).click()
  
  // Verificar
  cy.wait('@addCart')
  cy.contains(/agregado|éxito/i).should('be.visible')
  
  // Ir al carrito
  cy.visit('/cart')
  
  // Verificar producto en carrito
  cy.get('@productName').then((name) => {
    cy.contains(name).should('exist')
  })
  
  cy.get('input[type="number"]').first()
    .should('have.value', '2')
})
```

### Flujo CRUD Admin

```typescript
describe('CRUD de Productos en Admin', () => {
  beforeEach(() => {
    // Login como admin
    cy.visit('/login')
    cy.get('input[type="email"]').type('admin@test.com')
    cy.get('input[type="password"]').type('admin123')
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/admin')
  })

  it('Debe crear, editar y eliminar producto', () => {
    // CREAR
    cy.contains('button', /nuevo/i).click()
    cy.get('input[name="nombre"]').type('Producto Test')
    cy.get('input[name="precio"]').type('99.99')
    cy.contains('button', /guardar/i).click()
    cy.contains('Producto Test').should('exist')
    
    // EDITAR
    cy.contains('Producto Test')
      .parents('tr')
      .find('button[title*="edit"]')
      .click()
    
    cy.get('input[name="precio"]').clear().type('149.99')
    cy.contains('button', /guardar/i).click()
    cy.contains('149.99').should('exist')
    
    // ELIMINAR
    cy.contains('Producto Test')
      .parents('tr')
      .find('button[title*="delete"]')
      .click()
    
    cy.contains('button', /confirmar/i).click()
    cy.contains('Producto Test').should('not.exist')
  })
})
```

---

## 1️⃣2️⃣ Mejores Prácticas

### ✅ DO (Hacer)

```typescript
// ✅ Usar comandos personalizados
cy.login('user@test.com', 'password')

// ✅ Aserciones múltiples
cy.get('button')
  .should('be.visible')
  .and('not.be.disabled')
  .and('contain', 'Enviar')

// ✅ Selectores semánticos
cy.get('[data-testid="submit-button"]')

// ✅ Mensajes descriptivos
cy.get('.product').should('exist', 'Producto debería estar visible')
```

### ❌ DON'T (No Hacer)

```typescript
// ❌ Esperas arbitrarias
cy.wait(3000)  // Usar .should() en su lugar

// ❌ Selectores frágiles
cy.get('div > div > span:nth-child(3)')

// ❌ Variables fuera de contexto
let myValue;  // Usar .then() o alias

// ❌ Aserciones sin contexto
cy.get('button').should('exist')  // ¿Qué botón?
```

---

## 📚 Recursos Adicionales

- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress API](https://docs.cypress.io/api/table-of-contents)
- [Chai Assertions](https://www.chaijs.com/api/bdd/)

---

*¡Usa estos ejemplos como base para tus propias pruebas!* 🚀
