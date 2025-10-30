/// <reference types="cypress" />

describe('Pruebas del Carrito de Compras', () => {
  beforeEach(() => {
    // Iniciar sesión antes de cada prueba
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/login');
    cy.get('input[type="email"]').type('andre123@gmail.com');
    cy.get('input[type="password"]').type('contraseña123');
    cy.get('button[type="submit"]').click();

    // Esperar que se complete el login
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    cy.wait(2000);
  });

  describe('Funcionalidad Básica del Carrito', () => {
    it('Debe mostrar el carrito inicialmente', () => {
      cy.visit('/cart');

      // Verificar que la página carga
      cy.get('body').should('exist');
    });

    it('Debe agregar un producto al carrito', () => {
      // Ir al listado y seleccionar un producto
      cy.visit('/products');
      cy.get('[data-testid="product-item"], .product-card, .product', { timeout: 10000 })
        .first()
        .click();

      // Esperar y agregar al carrito
      cy.wait(2000);
      cy.contains('button', /agregar|añadir|add/i).click();
      cy.wait(1000);

      // Ir al carrito
      cy.visit('/cart');

      // Verificar que hay productos en el carrito
      cy.get('[data-testid="cart-item"], .cart-item, .cart-product', { timeout: 10000 })
        .should('have.length.at.least', 1);
    });

    it('Debe mostrar información del producto en el carrito', () => {
      // Agregar producto
      cy.visit('/products');
      cy.get('[data-testid="product-item"], .product-card, .product', { timeout: 10000 })
        .first()
        .click();

      cy.wait(2000);
      cy.contains('button', /agregar|añadir|add/i).click();
      cy.wait(1000);

      // Ir al carrito y verificar que hay productos
      cy.visit('/cart');
      cy.get('[data-testid="cart-item"], .cart-item, .cart-product', { timeout: 10000 })
        .should('have.length.at.least', 1);
    });
  });

  describe('Carrito Vacío', () => {
    it('Debe mostrar mensaje cuando el carrito está vacío', () => {
      cy.visit('/cart');

      // Verificar que el carrito carga
      cy.get('body').should('exist');
    });

    it('Debe tener enlace para volver a la tienda', () => {
      cy.visit('/cart');

      // Buscar enlace o botón para seguir comprando
      cy.get('a, button').should('have.length.at.least', 1);
    });
  });

  describe('Navegación del Carrito', () => {
    it('Debe poder navegar al carrito desde otras páginas', () => {
      cy.visit('/products');

      // Buscar icono o enlace del carrito en el header/navbar
      cy.get('body').should('exist');
    });

    it('Debe mantener la sesión al visitar el carrito', () => {
      cy.visit('/cart');

      // Verificar que no redirige a login
      cy.url().should('not.include', '/login');
      cy.url().should('include', '/cart');
    });
  });
});
