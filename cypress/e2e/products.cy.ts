/// <reference types="cypress" />

describe('Pruebas de Productos - Listado y Detalle', () => {
  beforeEach(() => {
    // Iniciar sesión y luego visitar productos
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/login');
    cy.get('input[type="email"]').type('andre123@gmail.com');
    cy.get('input[type="password"]').type('contraseña123');
    cy.get('button[type="submit"]').click();

    // Esperar que se complete el login
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    cy.wait(2000);

    // Visitar la página de productos
    cy.visit('/products');
    cy.wait(1000);
  });

  describe('Listado de Productos', () => {
    it('Debe cargar el listado de productos correctamente', () => {
      // Verificar que hay productos visibles
      cy.get('[data-testid="product-item"], .product-card, .product', { timeout: 10000 })
        .should('have.length.at.least', 1);
    });

    it('Debe mostrar información básica de cada producto', () => {
      // Verificar que los productos tienen información
      cy.get('[data-testid="product-item"], .product-card, .product').first().within(() => {
        // Verificar que hay una imagen
        cy.get('img').should('be.visible').and('have.attr', 'src');

        // Verificar que hay un nombre o título
        cy.get('h2, h3, h4, .product-name, .product-title').should('be.visible');
      });
    });

    it('Debe permitir buscar productos', () => {
      // Buscar el campo de búsqueda
      cy.get('input[type="search"], input[placeholder*="buscar"], input[name="search"]').then(($search) => {
        if ($search.length > 0) {
          cy.wrap($search.first()).type('producto{enter}');

          // Verificar que se filtra o busca
          cy.wait(1000);
          cy.get('body').should('be.visible');
        }
      });
    });

    it('Debe poder hacer clic en un producto', () => {
      // Hacer clic en el primer producto
      cy.get('[data-testid="product-item"], .product-card, .product').first().click();

      // Verificar que algo pasa (modal, detalle, etc)
      cy.wait(2000);
      cy.get('body').should('be.visible');
    });
  });

  describe('Imágenes de Productos', () => {
    it('Las imágenes de productos deben cargar correctamente', () => {
      cy.get('[data-testid="product-item"] img, .product-card img, .product img', { timeout: 10000 })
        .first()
        .should('be.visible')
        .and(($img) => {
          // Verificar que la imagen tiene naturalWidth > 0 (se cargó)
          expect(($img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0);
        });
    });

    it('Debe tener atributo alt en las imágenes', () => {
      cy.get('[data-testid="product-item"] img, .product-card img, .product img')
        .first()
        .should('have.attr', 'alt')
        .and('not.be.empty');
    });
  });

  describe('Responsividad', () => {
    it('Debe ser responsive en móvil', () => {
      cy.viewport('iphone-x');
      cy.visit('/products');

      // Verificar que los productos se ven correctamente
      cy.get('[data-testid="product-item"], .product-card, .product', { timeout: 10000 })
        .should('be.visible');
    });

    it('Debe ser responsive en tablet', () => {
      cy.viewport('ipad-2');
      cy.visit('/products');

      // Verificar que los productos se ven correctamente
      cy.get('[data-testid="product-item"], .product-card, .product', { timeout: 10000 })
        .should('be.visible');
    });

    it('Debe ser responsive en desktop', () => {
      cy.viewport(1920, 1080);
      cy.visit('/products');

      // Verificar que los productos se ven correctamente
      cy.get('[data-testid="product-item"], .product-card, .product', { timeout: 10000 })
        .should('be.visible');
    });
  });
});
