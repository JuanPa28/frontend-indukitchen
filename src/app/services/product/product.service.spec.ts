import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductoService } from './product.service';
import { ProductoDto } from './product.dto';
import { environment } from '../../../environments/environments';

describe('ProductoService', () => {
  let service: ProductoService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiBase}productos`;

  const makeProducto = (overrides?: Partial<ProductoDto>): ProductoDto => ({
    id: 1,
    nombre: 'Sartén',
    descripcion: 'Anti adherente',
    precio: 100,
    existencia: 5,
    peso: 1,
    imagen: '',
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductoService],
    });
    service = TestBed.inject(ProductoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAll debería hacer GET al endpoint base y devolver la lista (AAA)', () => {
    // Arrange
    const expected = [makeProducto(), makeProducto({ id: 2, nombre: 'Olla' })];
    let result: ProductoDto[] | undefined;

    // Act
    service.getAll().subscribe((res) => (result = res));
    const req = httpMock.expectOne(apiUrl);

    // Assert (request)
    expect(req.request.method).toBe('GET');
    req.flush(expected);

    // Assert (response)
    expect(result).toEqual(expected);
  });

  it('getById debería hacer GET a /:id', () => {
    // Arrange
    const prod = makeProducto({ id: 10 });

    // Act
    service.getById(10).subscribe((res) => expect(res).toEqual(prod));
    const req = httpMock.expectOne(`${apiUrl}/10`);

    // Assert
    expect(req.request.method).toBe('GET');
    req.flush(prod);
  });

  it('create debería hacer POST al endpoint base con el payload', () => {
    // Arrange
    const nuevo = makeProducto({ id: 0, nombre: 'Nuevo' });
    const creado = { ...nuevo, id: 123 };

    // Act
    service.create(nuevo).subscribe((res) => expect(res).toEqual(creado));
    const req = httpMock.expectOne(apiUrl);

    // Assert
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuevo);
    req.flush(creado);
  });

  it('add debería delegar en create (doble de prueba), manteniendo contrato', () => {
    // Arrange
    const p = makeProducto({ id: 0, nombre: 'Delegado' });
    const creado = { ...p, id: 77 };
    const spy = spyOn(service, 'create').and.returnValue({
      subscribe: (fn: any) => fn(creado),
    } as any);

    // Act
    service.add(p).subscribe((res) => {
      // Assert
      expect(service.create).toHaveBeenCalledWith(p);
      expect(res).toBe(creado);
    });
  });

  it('update debería lanzar error cuando id es inválido (undefined/<=0)', () => {
    // Arrange + Act + Assert
    expect(() => service.update({} as any)).toThrowError(
      'El producto a actualizar debe tener un id válido'
    );
    expect(() => service.update(makeProducto({ id: 0 }))).toThrowError(
      'El producto a actualizar debe tener un id válido'
    );
    expect(() => service.update(makeProducto({ id: -5 }))).toThrowError(
      'El producto a actualizar debe tener un id válido'
    );
  });

  it('update debería hacer PUT a /:id con el payload cuando id es válido', () => {
    // Arrange
    const prod = makeProducto({ id: 5, nombre: 'Actualizado' });

    // Act
    service.update(prod).subscribe((res) => expect(res).toEqual(prod));
    const req = httpMock.expectOne(`${apiUrl}/5`);

    // Assert
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(prod);
    req.flush(prod);
  });

  it('delete debería hacer DELETE a /:id', () => {
    // Act
    service.delete(9).subscribe((res) => expect(res).toBeNull());
    const req = httpMock.expectOne(`${apiUrl}/9`);

    // Assert
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getById debería propagar errores HTTP (fluent-like assertion)', () => {
    // Arrange
    let captured: any;

    // Act
    service.getById(404).subscribe({
      next: () => fail('no debe resolverse'),
      error: (e) => (captured = e),
    });
    const req = httpMock.expectOne(`${apiUrl}/404`);

    // Assert
    expect(req.request.method).toBe('GET');
    req.flush('not found', { status: 404, statusText: 'Not Found' });
    expect(captured.status).toBe(404);
  });
});
