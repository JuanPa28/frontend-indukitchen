// ***********************************************************
// Support file - Comandos personalizados y configuración global
// ***********************************************************

import '@cypress/code-coverage/support';

// Comandos personalizados para el proyecto
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Comando personalizado para hacer login
       * @example cy.login('user@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Comando personalizado para hacer login como admin
       * @example cy.loginAsAdmin()
       */
      loginAsAdmin(): Chainable<void>;

      /**
       * Comando personalizado para limpiar el carrito
       * @example cy.clearCart()
       */
      clearCart(): Chainable<void>;

      /**
       * Comando personalizado para agregar producto al carrito
       * @example cy.addProductToCart(1, 2)
       */
      addProductToCart(productId: number, quantity: number): Chainable<void>;
    }
  }
}

// Implementación del comando de login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();
  // Esperar a que se complete el login
  cy.url().should('not.include', '/login');
});

// Implementación del comando de login como admin
Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/login');
  cy.get('input[type="email"]').clear().type('crud@crud.crud');
  cy.get('input[type="password"]').clear().type('adminc');
  cy.get('button[type="submit"]').click();
  // Esperar a que se complete el login y redirija a admin
  cy.url().should('include', '/admin');
});

// Implementación del comando para limpiar el carrito
Cypress.Commands.add('clearCart', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('cart');
    win.localStorage.removeItem('cartItems');
  });
});

// Implementación del comando para agregar producto al carrito
Cypress.Commands.add('addProductToCart', (productId: number, quantity: number) => {
  cy.visit(`/detail/${productId}`);
  cy.get('input[type="number"]').clear().type(quantity.toString());
  cy.contains('button', /agregar|añadir/i).click();
  cy.contains(/producto.*agregado|añadido.*carrito/i, { timeout: 5000 });
});

// Configuración global de Cypress
beforeEach(() => {
  // Limpiar localStorage antes de cada prueba
  cy.clearLocalStorage();

  // Preservar ciertos datos si es necesario
  // cy.clearLocalStorage(/^(?!auth_token$).*$/);
});

// Manejo de excepciones no capturadas
Cypress.on('uncaught:exception', (err, runnable) => {
  // Retornar false aquí previene que Cypress falle la prueba
  // Solo en casos específicos donde esperamos ciertos errores
  if (err.message.includes('ResizeObserver') || err.message.includes('Firebase')) {
    return false;
  }
  return true;
});
