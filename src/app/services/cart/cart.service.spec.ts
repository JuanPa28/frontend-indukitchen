import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CarritoService } from './cart.service';
import { environment } from '../../../environments/environments';
import { CartDto } from './cart.dto';
import { DetailDto } from '../detail/detail.dto';

describe('CarritoService', () => {
  let service: CarritoService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiBase}carritos`;
  let store: Record<string, string>;

  const setLocal = (k: string, v: string) => (store[k] = v);

  const makeDetalle = (overrides?: Partial<DetailDto>): DetailDto => ({
    idProducto: 10,
    cantidad: 1,
    producto: {
      id: 10,
      nombre: 'Sartén',
      descripcion: '',
      precio: 50,
      existencia: 5,
      peso: 1,
      imagen: '',
    } as any,
    ...overrides,
  });

  beforeEach(() => {
    store = {};
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CarritoService],
    });

    // Mock de localStorage (FIRST)
    spyOn(localStorage, 'getItem').and.callFake((k: string) => store[k] ?? null);
    spyOn(localStorage, 'setItem').and.callFake((k: string, v: string) => (store[k] = v));
    spyOn(localStorage, 'removeItem').and.callFake((k: string) => delete store[k]);

    service = TestBed.inject(CarritoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('constructor debería leer carritoId de localStorage si existe (AAA)', () => {
    // Arrange
    store = { carritoId: 'ABC' };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CarritoService],
    });

    (localStorage.getItem as jasmine.Spy).and.callFake((k: string) => store[k] ?? null);
    (localStorage.setItem as jasmine.Spy).and.callFake((k: string, v: string) => (store[k] = v));
    (localStorage.removeItem as jasmine.Spy).and.callFake((k: string) => delete store[k]);

    // Act
    const s = TestBed.inject(CarritoService);

    // Assert
    let emitted: string | null = null;
    s.currentCartId$.subscribe((id) => (emitted = id));
    expect(emitted!).toBe('ABC');
  });

  it('getCurrentCartId debería crear id por defecto cuando no existe y publicarlo', () => {
    // Arrange
    expect(store['carritoId']).toBeUndefined();

    let emitted: string | null = null;
    service.currentCartId$.subscribe((id) => (emitted = id));

    // Act
    const id = service.getCurrentCartId();

    // Assert
    expect(id).toBe('1');
    expect(store['carritoId']).toBe('1');
    expect(emitted!).toBe('1');
  });

  it('getAll / getById / create / update / delete deberían usar URLs correctas', () => {
    // Arrange
    const sample: CartDto = { id: 'C1', detalles: [] };

    // Act
    service.getAll().subscribe();
    const r1 = httpMock.expectOne(apiUrl);
    expect(r1.request.method).toBe('GET');
    r1.flush([sample]);

    service.getById('C1').subscribe();
    const r2 = httpMock.expectOne(`${apiUrl}/C1`);
    expect(r2.request.method).toBe('GET');
    r2.flush(sample);

    service.create(sample).subscribe();
    const r3 = httpMock.expectOne(apiUrl);
    expect(r3.request.method).toBe('POST');
    expect(r3.request.body).toEqual(sample);
    r3.flush(sample);

    service.update(sample).subscribe();
    const r4 = httpMock.expectOne(apiUrl);
    expect(r4.request.method).toBe('PUT');
    expect(r4.request.body).toEqual(sample);
    r4.flush(sample);

    service.delete('C1').subscribe();
    const r5 = httpMock.expectOne(`${apiUrl}/C1`);
    expect(r5.request.method).toBe('DELETE');
    r5.flush(null);
  });

  it('addDetalle/updateDetalle/removeDetalle deberían notificar cambios', () => {
    // Arrange
    const detalle = makeDetalle();
    let changedCount = 0;
    service.cartChanged$.subscribe((flag) => {
      if (flag) changedCount++;
    });

    // Act
    service.addDetalle('C9', detalle).subscribe();
    const a = httpMock.expectOne(`${apiUrl}/C9/detalles`);
    expect(a.request.method).toBe('POST');
    a.flush({ id: 'C9', detalles: [detalle] });

    service.updateDetalle('C9', detalle).subscribe();
    const u = httpMock.expectOne(`${apiUrl}/C9/detalles/10`);
    expect(u.request.method).toBe('PUT');
    u.flush({ id: 'C9', detalles: [detalle] });

    service.removeDetalle('C9', 10).subscribe();
    const d = httpMock.expectOne(`${apiUrl}/C9/detalles/10`);
    expect(d.request.method).toBe('DELETE');
    d.flush({ id: 'C9', detalles: [] });

    // Assert
    expect(changedCount).toBe(3);
  });

  describe('addProductToCartSimple', () => {
    it('debería agregar al carrito existente con addDetalle (éxito)', () => {
      // Arrange
      setLocal('carritoId', 'C1');
      const producto = { id: 10, nombre: 'Sartén' };

      // Act
      service.addProductToCartSimple(producto, 2).subscribe((res) => {
        expect(res.id).toBe('C1');
      });

      // Assert
      const req = httpMock.expectOne(`${apiUrl}/C1/detalles`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(jasmine.objectContaining({ idProducto: 10, cantidad: 2 }));
      req.flush({ id: 'C1', detalles: [] });
    });

    it('debería crear carrito cuando addDetalle falla y propagar id a localStorage', () => {
      // Arrange
      const producto = { id: 11, nombre: 'Olla' };
      let changed = false;
      service.cartChanged$.subscribe((f) => (changed = changed || !!f));

      // Act
      service.addProductToCartSimple(producto, 1).subscribe((res) => {
        expect(res.id).toBe('C9');
        expect(store['carritoId']).toBe('C9');
      });

      // Assert
      const add = httpMock.expectOne(`${apiUrl}/1/detalles`);
      expect(add.request.method).toBe('POST');
      add.flush('fail', { status: 404, statusText: 'Not Found' });

      const create = httpMock.expectOne(apiUrl);
      expect(create.request.method).toBe('POST');
      expect(create.request.body).toEqual(
        jasmine.objectContaining({ detalles: [jasmine.any(Object)] })
      );
      create.flush({ id: 'C9', detalles: [] });

      expect(changed).toBeTrue();
    });

    it('debería propagar error claro cuando creación de carrito falla', () => {
      // Arrange
      const producto = { id: 12, nombre: 'Licuadora' };
      let captured: any;

      // Act
      service.addProductToCartSimple(producto, 1).subscribe({
        next: () => fail('no debería resolverse'),
        error: (e) => (captured = e),
      });

      // Assert
      httpMock
        .expectOne(`${apiUrl}/1/detalles`)
        .flush('x', { status: 404, statusText: 'Not Found' });
      httpMock.expectOne(apiUrl).flush('boom', { status: 500, statusText: 'Server Error' });

      expect(captured).toEqual(jasmine.any(Error));
      expect((captured as Error).message).toContain('No se pudo crear el carrito');
    });
  });

  describe('addProductToCart (mejorado)', () => {
    it('debería actualizar detalle cuando el producto ya existe', () => {
      // Arrange
      setLocal('carritoId', 'C2');
      const producto = { id: 10, nombre: 'Sartén' };

      // Act
      service.addProductToCart(producto, 1).subscribe();

      // Assert
      const get = httpMock.expectOne(`${apiUrl}/C2`);
      expect(get.request.method).toBe('GET');
      get.flush({ id: 'C2', detalles: [{ idProducto: 10, cantidad: 2 }] });

      const put = httpMock.expectOne(`${apiUrl}/C2/detalles/10`);
      expect(put.request.method).toBe('PUT');
      expect(put.request.body.cantidad).toBe(3);
      put.flush({ id: 'C2', detalles: [{ idProducto: 10, cantidad: 3 }] });
    });

    it('debería agregar detalle cuando el producto no existe', () => {
      // Arrange
      setLocal('carritoId', 'C3');
      const producto = { id: 99, nombre: 'Tostadora' };

      // Act
      service.addProductToCart(producto, 2).subscribe();

      // Assert
      const get = httpMock.expectOne(`${apiUrl}/C3`);
      get.flush({ id: 'C3', detalles: [{ idProducto: 10, cantidad: 2 }] });

      const post = httpMock.expectOne(`${apiUrl}/C3/detalles`);
      expect(post.request.method).toBe('POST');
      expect(post.request.body).toEqual(jasmine.objectContaining({ idProducto: 99, cantidad: 2 }));
      post.flush({ id: 'C3', detalles: [] });
    });

    it('debería crear carrito cuando getById falla con 404 u origen 0', () => {
      // Arrange
      const producto = { id: 7, nombre: 'Cacerola' };
      let changed = false;
      service.cartChanged$.subscribe((f) => (changed = changed || !!f));

      // Act
      service.addProductToCart(producto, 1).subscribe((cart) => {
        expect(cart.id).toBe('C7');
        expect(store['carritoId']).toBe('C7');
      });

      // Assert
      const get = httpMock.expectOne(`${apiUrl}/1`);
      get.flush('x', { status: 404, statusText: 'Not Found' });

      const create = httpMock.expectOne(apiUrl);
      expect(create.request.body).toEqual(
        jasmine.objectContaining({ detalles: [jasmine.any(Object)] })
      );
      create.flush({ id: 'C7', detalles: [] });

      expect(changed).toBeTrue();
    });

    it('debería propagar error custom cuando getById falla con otro status', () => {
      // Arrange
      const producto = { id: 5, nombre: 'Espátula' };
      let captured: any;

      // Act
      service.addProductToCart(producto, 1).subscribe({
        next: () => fail('no debe resolverse'),
        error: (e) => (captured = e),
      });

      // Assert
      const get = httpMock.expectOne(`${apiUrl}/1`);
      get.flush({ message: 'bad' }, { status: 400, statusText: 'Bad Request' });

      expect(captured).toEqual(jasmine.any(Error));
      expect(captured.message).toContain('Error al agregar producto:');
      expect(captured.details.product).toBe('Espátula');
      expect(captured.details.cartId).toBe('1');
    });
  });

  it('clearCart debería llamar DELETE, limpiar localStorage y notificar', () => {
    // Arrange
    setLocal('carritoId', 'Z9');
    let emittedId: string | null | undefined;
    let changed = false;
    service.currentCartId$.subscribe((id) => (emittedId = id));
    service.cartChanged$.subscribe((f) => (changed = changed || !!f));

    // Act
    service.clearCart().subscribe();

    // Assert
    const del = httpMock.expectOne(`${apiUrl}/Z9`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null);

    expect(store['carritoId']).toBeUndefined();
    expect(emittedId).toBeNull();
    expect(changed).toBeTrue();
  });

  describe('createWithClient', () => {
    it('debería validar cedula y detalles (throws)', () => {
      expect(() => service.createWithClient('', [])).toThrowError(
        'La cédula del cliente es requerida'
      );
      expect(() => service.createWithClient('123', [])).toThrowError(
        'Los detalles del carrito son requeridos'
      );
    });

    it('debería POSTear con idCliente y productoIds, setear carritoId y notificar', () => {
      // Arrange
      const detalles: DetailDto[] = [makeDetalle({ idProducto: 3, cantidad: 2 })];
      let changed = false;
      let current: string | null = null;
      service.cartChanged$.subscribe((f) => (changed = changed || !!f));
      service.currentCartId$.subscribe((id) => (current = id));

      // Act
      service.createWithClient('  99887766 ', detalles).subscribe((cart) => {
        expect(cart.id).toBe('NC1');
      });

      // Assert
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.body).toEqual({ idCliente: '99887766', productoIds: [3] });
      req.flush({ id: 'NC1', detalles: [] });

      expect(store['carritoId']).toBe('NC1');
      expect(current!).toBe('NC1');
      expect(changed).toBeTrue();
    });

    it('debería propagar error y loggear en catchError', () => {
      // Arrange
      const detalles: DetailDto[] = [makeDetalle()];
      let captured: any;

      // Act
      service.createWithClient('1', detalles).subscribe({
        next: () => fail('no debe resolverse'),
        error: (e) => (captured = e),
      });

      // Assert
      const req = httpMock.expectOne(apiUrl);
      req.flush('boom', { status: 500, statusText: 'Server Error' });
      expect(captured).toBeTruthy();
    });
  });

  it('process debería POSTear a /procesar, actualizar carritoId y notificar', () => {
    // Arrange
    let changed = false;
    let current: string | null = null;
    service.cartChanged$.subscribe((f) => (changed = changed || !!f));
    service.currentCartId$.subscribe((id) => (current = id));

    const body = { cliente: {} as any, productoIds: [1, 2] };

    // Act
    service.process(body as any).subscribe((cart) => expect(cart.id).toBe('CP1'));

    // Assert
    const req = httpMock.expectOne(`${apiUrl}/procesar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Accept')).toBe('application/json');
    req.flush({ id: 'CP1', detalles: [] });

    expect(store['carritoId']).toBe('CP1');
    expect(current!).toBe('CP1');
    expect(changed).toBeTrue();
  });
});
