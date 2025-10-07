import { LocalCartService, LocalCartItem } from './local-cart.service';

describe('LocalCartService', () => {
  let service: LocalCartService;
  let store: Record<string, string>;

  const STORAGE_KEY = 'indukitchen_local_cart';

  const setLocal = (k: string, v: string) => (store[k] = v);

  const makeItem = (overrides?: Partial<LocalCartItem>): LocalCartItem => ({
    idProducto: 1,
    cantidad: 1,
    producto: {
      id: 1,
      nombre: 'Sartén',
      descripcion: '',
      precio: 100,
      existencia: 5,
      peso: 1,
      imagen: '',
    } as any,
    ...overrides,
  });

  beforeEach(() => {
    store = {};
    spyOn(localStorage, 'getItem').and.callFake((k: string) => store[k] ?? null);
    spyOn(localStorage, 'setItem').and.callFake((k: string, v: string) => (store[k] = v));
    spyOn(localStorage, 'removeItem').and.callFake((k: string) => delete store[k]);

    service = new LocalCartService();
  });

  it('constructor debería cargar carrito desde localStorage si existe', () => {
    // Arrange
    const saved = [
      makeItem(),
      makeItem({ idProducto: 2, producto: { id: 2, nombre: 'Olla', precio: 50 } as any }),
    ];
    setLocal(STORAGE_KEY, JSON.stringify(saved));

    // Act
    service = new LocalCartService();

    // Assert
    expect(service.getCartItems().length).toBe(2);
    expect(service.isEmpty()).toBeFalse();
  });

  it('addProduct debería agregar nuevo item y actualizar observables', (done) => {
    // Arrange
    const nexts: LocalCartItem[][] = [];
    service.cartItems$.subscribe((list) => nexts.push(list));

    // Act
    const ok = service.addProduct(makeItem().producto as any, 2);

    // Assert
    expect(ok).toBeTrue();
    expect(service.getCartItems()).toHaveSize(1 as any);
    expect(nexts[nexts.length - 1][0].cantidad).toBe(2);
    expect(service.getCurrentTotal()).toBe(200);
    expect(service.getCurrentItemCount()).toBe(2);
    done();
  });

  it('addProduct debería incrementar cantidad si el producto ya existe', () => {
    // Arrange
    const p = makeItem().producto as any;

    // Act
    service.addProduct(p, 1);
    service.addProduct(p, 3);

    // Assert
    const items = service.getCartItems();
    expect(items[0].cantidad).toBe(4);
  });

  it('addProduct debería retornar false cuando setItem lanza excepción (catch)', () => {
    // Arrange
    (localStorage.setItem as jasmine.Spy).and.callFake(() => {
      throw new Error('fail');
    });

    // Act
    const ok = service.addProduct(makeItem().producto as any, 1);

    // Assert
    expect(ok).toBeFalse();
  });

  it('updateQuantity debería actualizar cantidad (>0) y retornar true', () => {
    // Arrange
    const p = makeItem().producto as any;
    service.addProduct(p, 1);

    // Act
    const ok = service.updateQuantity(1, 5);

    // Assert
    expect(ok).toBeTrue();
    expect(service.getCartItems()[0].cantidad).toBe(5);
  });

  it('updateQuantity con cantidad <=0 debería delegar en removeProduct', () => {
    // Arrange
    const p = makeItem().producto as any;
    service.addProduct(p, 2);

    // Act
    const ok = service.updateQuantity(1, 0);

    // Assert
    expect(ok).toBeTrue();
    expect(service.getCartItems().length).toBe(0);
  });

  it('updateQuantity debería retornar false cuando producto no existe', () => {
    // Act
    const ok = service.updateQuantity(999, 3);

    // Assert
    expect(ok).toBeFalse();
  });

  it('updateQuantity debería retornar false cuando setItem lanza (catch)', () => {
    // Arrange
    const p = makeItem().producto as any;
    service.addProduct(p, 1);
    (localStorage.setItem as jasmine.Spy).and.callFake(() => {
      throw new Error('boom');
    });

    // Act
    const ok = service.updateQuantity(1, 3);

    // Assert
    expect(ok).toBeFalse();
  });

  it('removeProduct debería eliminar cuando existe y retornar true', () => {
    // Arrange
    service.addProduct(makeItem().producto as any, 1);

    // Act
    const ok = service.removeProduct(1);

    // Assert
    expect(ok).toBeTrue();
    expect(service.getCartItems().length).toBe(0);
  });

  it('removeProduct debería retornar false cuando no existe', () => {
    // Act
    const ok = service.removeProduct(123);

    // Assert
    expect(ok).toBeFalse();
  });

  it('removeProduct debería retornar false cuando setItem lanza (catch)', () => {
    // Arrange
    service.addProduct(makeItem().producto as any, 1);
    (localStorage.setItem as jasmine.Spy).and.callFake(() => {
      throw new Error('err');
    });

    // Act
    const ok = service.removeProduct(1);

    // Assert
    expect(ok).toBeFalse();
  });

  it('clearCart debería limpiar items y actualizar estado', () => {
    // Arrange
    service.addProduct(makeItem().producto as any, 2);

    // Act
    service.clearCart();

    // Assert
    expect(service.getCartItems()).toEqual([]);
    expect(service.isEmpty()).toBeTrue();
    expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify([]));
  });

  it('getCartItems debería devolver copia, no referencia interna', () => {
    // Arrange
    service.addProduct(makeItem().producto as any, 1);

    // Act
    const copy = service.getCartItems();
    copy.push({
      idProducto: 999,
      cantidad: 1,
      producto: { id: 999, nombre: 'X', precio: 1 } as any,
    });

    // Assert
    const fresh = service.getCartItems();
    expect(fresh.length).toBe(1);
    expect(fresh).not.toBe(copy);
  });

  it('getCurrentTotal / getCurrentItemCount / isEmpty deberían reflejar estado', () => {
    // Arrange
    expect(service.isEmpty()).toBeTrue();

    // Act
    service.addProduct(
      makeItem({ producto: { id: 1, nombre: 'A', precio: 10 } as any }).producto as any,
      2
    );
    service.addProduct(
      makeItem({ idProducto: 2, producto: { id: 2, nombre: 'B', precio: 5 } as any })
        .producto as any,
      3
    );

    // Assert
    expect(service.isEmpty()).toBeFalse();
    expect(service.getCurrentTotal()).toBe(2 * 10 + 3 * 5);
    expect(service.getCurrentItemCount()).toBe(5);
  });

  describe('toBackendFormat', () => {
    it('debería mapear items a DetailDto válidos', () => {
      // Arrange
      service.addProduct(
        makeItem({ producto: { id: 3, nombre: 'C', precio: 7 } as any }).producto as any,
        4
      );

      // Act
      const detalles = service.toBackendFormat();

      // Assert
      expect(detalles).toEqual([{ idProducto: 3, cantidad: 4 }]);
    });

    it('debería lanzar error si idProducto es inválido', () => {
      // Arrange
      (service as any).cartItems = [
        { idProducto: 0, cantidad: 1, producto: { id: 0, nombre: 'X', precio: 1 } },
      ];

      // Act + Assert
      expect(() => service.toBackendFormat()).toThrowError(/ID de producto válido/i);
    });

    it('debería lanzar error si cantidad es inválida', () => {
      // Arrange
      (service as any).cartItems = [
        { idProducto: 1, cantidad: 0, producto: { id: 1, nombre: 'X', precio: 1 } },
      ];

      // Act + Assert
      expect(() => service.toBackendFormat()).toThrowError(/cantidad válida/i);
    });
  });

  it('getCartDataForBackend debería devolver estructura con detalles, total e itemCount', () => {
    // Arrange
    service.addProduct(
      makeItem({ producto: { id: 4, nombre: 'D', precio: 20 } as any }).producto as any,
      2
    );

    // Act
    const data = service.getCartDataForBackend();

    // Assert
    expect(data.detalles).toEqual([{ idProducto: 4, cantidad: 2 }]);
    expect(data.total).toBe(40);
    expect(data.itemCount).toBe(2);
  });
});
