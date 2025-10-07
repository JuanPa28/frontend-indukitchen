import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FacturaService } from './factura.service';
import { environment } from '../../../environments/environments';
import { FacturaDto } from './factura.dto';

describe('FacturaService', () => {
  let service: FacturaService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiBase}facturas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FacturaService],
    });

    service = TestBed.inject(FacturaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('createFromCarrito debería POSTear con headers y payload', () => {
    // Arrange
    const idCarrito = 'C1';
    const expected: FacturaDto = { id: 'F1', idCarrito };

    // Act
    service.createFromCarrito(idCarrito).subscribe((res) => {
      expect(res).toEqual(expected);
    });

    // Assert
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Accept')).toBe('application/json');
    expect(req.request.body).toEqual({ idCarrito: 'C1' });
    req.flush(expected);
  });

  it('getById debería hacer GET por id', () => {
    // Arrange
    const factura: FacturaDto = { id: 'F2', idCarrito: 'C9' };

    // Act
    service.getById('F2').subscribe((res) => expect(res).toEqual(factura));

    // Assert
    const req = httpMock.expectOne(`${apiUrl}/F2`);
    expect(req.request.method).toBe('GET');
    req.flush(factura);
  });

  it('getAll debería hacer GET a /facturas', () => {
    // Arrange
    const list: FacturaDto[] = [{ id: 'F1', idCarrito: 'C1' }];

    // Act
    service.getAll().subscribe((res) => expect(res).toEqual(list));

    // Assert
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(list);
  });

  it('sendByEmail debería POSTear a /:id/email con headers', () => {
    // Arrange
    const id = 'F1';

    // Act
    service.sendByEmail(id).subscribe((res) => expect(res).toEqual({ ok: true }));

    // Assert
    const req = httpMock.expectOne(`${apiUrl}/${id}/email`);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Accept')).toBe('application/json');
    expect(req.request.body).toEqual({});
    req.flush({ ok: true });
  });

  it('getPdfBlob debería GETear PDF como Blob', () => {
    // Arrange
    const id = 'F3';
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });

    // Act
    service.getPdfBlob(id).subscribe((res) => {
      expect(res).toBeTruthy();
      expect(res instanceof Blob).toBeTrue();
      expect((res as Blob).type).toBe('application/pdf');
    });

    // Assert
    const req = httpMock.expectOne(`${apiUrl}/${id}/pdf`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(blob);
  });

  it('openPdfInNewTab debería abrir nueva pestaña con URL del PDF', () => {
    // Arrange
    const openSpy = spyOn(window, 'open').and.stub();

    // Act
    service.openPdfInNewTab('F7');

    // Assert
    expect(openSpy).toHaveBeenCalledWith(`${apiUrl}/F7/pdf`, '_blank');
  });

  it('delete debería hacer DELETE a /:id', () => {
    // Arrange
    const id = 'F9';

    // Act
    service.delete(id).subscribe((res) => expect(res).toBeNull());

    // Assert
    const req = httpMock.expectOne(`${apiUrl}/${id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('createFromCarrito debería propagar error del backend', () => {
    // Arrange
    let captured: any;

    // Act
    service.createFromCarrito('CERR').subscribe({
      next: () => fail('no debe resolverse'),
      error: (e) => (captured = e),
    });

    // Assert
    const req = httpMock.expectOne(apiUrl);
    req.flush('boom', { status: 500, statusText: 'Server Error' });
    expect(captured).toBeTruthy();
  });

  it('sendByEmail debería propagar error del backend', () => {
    // Arrange
    let captured: any;

    // Act
    service.sendByEmail('FERR').subscribe({
      next: () => fail('no debe resolverse'),
      error: (e) => (captured = e),
    });

    // Assert
    const req = httpMock.expectOne(`${apiUrl}/FERR/email`);
    req.flush('x', { status: 400, statusText: 'Bad Request' });
    expect(captured).toBeTruthy();
  });
});
