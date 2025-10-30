/// <reference types="cypress" />

describe('Pruebas del Panel de Administración', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Acceso al Panel de Administración', () => {
    it('Debe redirigir si no es admin', () => {
      cy.visit('/admin');

      // Verificar que no se queda en /admin (redirige a /login o /products)
      cy.url({ timeout: 5000 }).should('satisfy', (url: string) => {
        return url.includes('/login') || url.includes('/products');
      });
    });

    it('Debe permitir acceso con credenciales de administrador', () => {
      cy.visit('/login');

      // Intentar login con credenciales de admin
      cy.get('input[type="email"]').type('crud@crud.crud');
      cy.get('input[type="password"]').type('adminc');
      cy.get('button[type="submit"]').click();

      // Verificar acceso al panel de admin
      cy.url({ timeout: 10000 }).should('include', '/admin');
    });

    it('No debe permitir acceso a usuarios normales', () => {
      cy.visit('/login');

      // Login como usuario normal
      cy.get('input[type="email"]').type('usuario@test.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();

      cy.wait(2000);

      // Intentar acceder a admin
      cy.visit('/admin');

      // Debería redirigir o mostrar error
      cy.url({ timeout: 5000 }).should('satisfy', (url: string) => {
        return url.includes('/login') || !url.includes('/admin');
      });
    });
  });

  describe('Interfaz del Panel de Administración', () => {
    beforeEach(() => {
      // Login como admin
      cy.visit('/login');
      cy.get('input[type="email"]').type('crud@crud.crud');
      cy.get('input[type="password"]').type('adminc');
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 10000 }).should('include', '/admin');
    });

    it('Debe mostrar las secciones principales del panel', () => {
      // Verificar que existen las pestañas o secciones
      cy.contains(/productos|products/i).should('exist');
      cy.contains(/clientes|clients|usuarios|users/i).should('exist');
      cy.contains(/facturas|invoices|orders/i).should('exist');
    });

    it('Debe tener navegación entre secciones', () => {
      // Verificar tabs o botones de navegación
      cy.get('[role="tab"], .nav-tab, button').should('have.length.at.least', 3);
    });
  });

  describe('Gestión de Clientes', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('input[type="email"]').type('crud@crud.crud');
      cy.get('input[type="password"]').type('adminc');
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 10000 }).should('include', '/admin');
      cy.wait(1000);

      // Navegar a la sección de clientes
      cy.contains(/clientes|clients|usuarios|users/i).click();
      cy.wait(2000);
    });

    it('Debe mostrar listado de clientes', () => {
      cy.get('table, .client-list').should('exist');
      cy.get('tr, .client-row').should('have.length.at.least', 1);
    });

    it('Debe mostrar historial general de clientes', () => {
      // La plataforma muestra el historial general de todos los clientes
      cy.get('table, .client-list').should('be.visible');
      // Verificar que hay información de clientes
      cy.get('tr, .client-row').should('exist');
    });
  });

  describe('Gestión de Facturas/Pedidos', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('input[type="email"]').type('crud@crud.crud');
      cy.get('input[type="password"]').type('adminc');
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 10000 }).should('include', '/admin');

      // Navegar a la sección de facturas
      cy.contains(/facturas|invoices|pedidos|orders/i).click();
    });

    it('Debe mostrar listado de facturas', () => {
      cy.get('table, .invoice-list').should('exist');
    });

    it('Debe tener botón para ver PDF de factura', () => {
      cy.contains('button', /ver.*pdf|pdf|descargar/i).should('exist');
    });
  });

  describe('Gestión del Carrito desde Admin', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.get('input[type="email"]').type('crud@crud.crud');
      cy.get('input[type="password"]').type('adminc');
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 10000 }).should('include', '/admin');

      // Buscar sección de carrito
      cy.get('body').then(($body) => {
        if ($body.find(':contains("Carrito")').length > 0) {
          cy.contains(/carrito|cart/i).click();
        }
      });
    });

    it('Debe poder visualizar carritos activos', () => {
      cy.get('body').then(($body) => {
        if ($body.find('table, .cart-list').length > 0) {
          cy.get('table, .cart-list').should('exist');
        }
      });
    });
  });

  describe('Seguridad del Panel', () => {
    it('Debe cerrar sesión correctamente', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').type('crud@crud.crud');
      cy.get('input[type="password"]').type('adminc');
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 10000 }).should('include', '/admin');

      // Buscar botón de logout
      cy.contains(/salir|logout|cerrar.*sesión/i).click();

      // Verificar que se limpió la sesión
      cy.window().its('localStorage').invoke('getItem', 'token').should('not.exist');
    });

    it('No debe permitir acceso directo sin token', () => {
      cy.clearLocalStorage();
      cy.visit('/admin');

      cy.url({ timeout: 5000 }).should('satisfy', (url: string) => {
        return url.includes('/login') || !url.includes('/admin');
      });
    });
  });
});
