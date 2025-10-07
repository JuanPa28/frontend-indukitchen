import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClienteService } from './client.service';
import { ClienteDto } from './client.dto';
import { environment } from '../../../environments/environments';

describe('ClienteService', () => {
  let service: ClienteService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiBase}clientes`;

  const makeCliente = (partial?: Partial<ClienteDto>): ClienteDto => ({
    cedula: '1234567890',
    nombre: 'Juan Perez',
    direccion: 'Av. 1',
    correo: 'user@example.com',
    telefono: '0999999999',
    ...partial,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClienteService],
    });
    service = TestBed.inject(ClienteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    (console.log as any)?.and?.stub?.();
    (console.error as any)?.and?.stub?.();
  });

  describe('create', () => {
    it('debería POSTear con headers y payload enriquecido y registrar éxito (AAA)', () => {
      // Arrange
      const cliente = {
        cedula: '1',
        nombre: 'Ana',
        direccion: 'Dir',
        correo: 'ana@mail.com',
        telefono: '3000000000',
      };
      spyOn(service as any, 'generateTempPassword').and.returnValue('Temporal123!');

      // Act
      service.create(cliente as any).subscribe();

      // Assert
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.body).toEqual(
        jasmine.objectContaining({
          ...cliente,
          disabled: false,
          locked: false,
          password: 'Temporal123!',
        })
      );
      req.flush(cliente);
    });

    it('debería registrar campos faltantes y aún así enviar la petición', () => {
      // Arrange
      const clienteIncompleto = makeCliente({
        telefono: '' as any,
        direccion: undefined as any,
        correo: null as any,
      });
      const logSpy = spyOn(console, 'log');
      const errorSpy = spyOn(console, 'error');

      // Act
      service.create(clienteIncompleto).subscribe();
      const req = httpMock.expectOne(apiUrl);

      // Assert
      expect(req.request.method).toBe('POST');
      expect(errorSpy).toHaveBeenCalledWith('❌ Campos faltantes o vacíos:', jasmine.any(Array));
      expect(errorSpy).toHaveBeenCalledWith('❌ Objeto completo:', clienteIncompleto);
      expect(logSpy).toHaveBeenCalled();

      req.flush({ ...clienteIncompleto });
    });

    it('debería registrar error detallado cuando el backend falla y propagar el error', () => {
      // Arrange
      const cliente = makeCliente();
      const logSpy = spyOn(console, 'log');
      const errorSpy = spyOn(console, 'error');
      let capturedError: any;

      // Act
      service.create(cliente).subscribe({
        next: () => fail('next no debería ejecutarse en error'),
        error: (err) => {
          capturedError = err;
        },
      });
      const req = httpMock.expectOne(apiUrl);

      const backendError = { code: 'E_VALIDATION', details: { field: 'correo' } };
      req.flush(backendError, { status: 400, statusText: 'Bad Request' });

      // Assert
      expect(capturedError.status).toBe(400);
      expect(errorSpy).toHaveBeenCalledWith('❌ Error detallado de la petición:');
      expect(errorSpy).toHaveBeenCalledWith('  - Status:', 400);
      expect(errorSpy).toHaveBeenCalledWith('  - Status Text:', 'Bad Request');
      expect(errorSpy).toHaveBeenCalledWith('  - Error Body:', backendError);
      expect(errorSpy).toHaveBeenCalledWith('  - Error Message:', jasmine.any(String));
      expect(errorSpy).toHaveBeenCalledWith('  - Headers enviados:', jasmine.any(Object));
      expect(errorSpy).toHaveBeenCalledWith('  - Datos enviados:', jasmine.any(String));
      expect(errorSpy).toHaveBeenCalledWith('  - URL:', apiUrl);
      expect(errorSpy).toHaveBeenCalledWith(
        '    - Detalles del error del backend:',
        jasmine.any(String)
      );
      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe('getByCedula', () => {
    it('debería GETear por cédula y devolver el cliente', () => {
      // Arrange
      const cedula = '123';
      const expected = makeCliente({ cedula });

      // Act
      let result: ClienteDto | undefined;
      service.getByCedula(cedula).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${apiUrl}/${cedula}`);

      // Assert
      expect(req.request.method).toBe('GET');
      req.flush(expected);
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('debería PUTear con el cliente y URL por cédula', () => {
      // Arrange
      const cliente = makeCliente();

      // Act
      let result: ClienteDto | undefined;
      service.update(cliente).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${apiUrl}/${cliente.cedula}`);

      // Assert
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(cliente);
      req.flush(cliente);
      expect(result).toEqual(cliente);
    });
  });

  describe('delete', () => {
    it('debería DELETEar por cédula', () => {
      // Arrange
      const cedula = '321';

      // Act
      let completed = false;
      service.delete(cedula).subscribe({ complete: () => (completed = true) });

      const req = httpMock.expectOne(`${apiUrl}/${cedula}`);

      // Assert
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      expect(completed).toBeTrue();
    });
  });

  describe('getAll', () => {
    it('debería GETear todos los clientes', () => {
      // Arrange
      const list = [makeCliente(), makeCliente({ cedula: '2', correo: 'x@y.com' })];

      // Act
      let result: ClienteDto[] | undefined;
      service.getAll().subscribe((r) => (result = r));

      const req = httpMock.expectOne(apiUrl);

      // Assert
      expect(req.request.method).toBe('GET');
      req.flush(list);
      expect(result).toEqual(list);
    });
  });

  describe('existsByCedula', () => {
    it('debería emitir true cuando GET por cédula responde 200', () => {
      // Arrange
      const cedula = '777';
      let result: boolean | undefined;

      // Act
      service.existsByCedula(cedula).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${apiUrl}/${cedula}`);
      expect(req.request.method).toBe('GET');
      req.flush(makeCliente({ cedula }));

      // Assert
      expect(result).toBeTrue();
    });

    it('debería emitir false cuando GET por cédula devuelve error (404)', () => {
      // Arrange
      const cedula = 'not-found';
      let result: boolean | undefined;

      // Act
      service.existsByCedula(cedula).subscribe((r) => (result = r));

      const req = httpMock.expectOne(`${apiUrl}/${cedula}`);
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

      // Assert
      expect(result).toBeFalse();
    });
  });

  describe('existsByCorreo', () => {
    it('debería normalizar y encontrar correo sin importar mayúsculas o espacios', () => {
      // Arrange
      const input = '  TEST@Email.com  ';
      const listado = [
        makeCliente({ correo: 'otro@dom.com' }),
        makeCliente({ cedula: '2', correo: 'test@email.com  ' }),
      ];
      let result: boolean | undefined;

      // Act
      service.existsByCorreo(input).subscribe((r) => (result = r));

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(listado);

      // Assert
      expect(result).toBeTrue();
    });

    it('debería retornar false cuando el backend responde lista nula', () => {
      // Arrange
      let result: boolean | undefined;

      // Act
      service.existsByCorreo('nada@nada.com').subscribe((r) => (result = r));

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(null);

      // Assert
      expect(result).toBeFalse();
    });

    it('debería retornar false cuando GET all falla', () => {
      // Arrange
      let result: boolean | undefined;

      // Act
      service.existsByCorreo('x@y.com').subscribe((r) => (result = r));

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'err' }, { status: 500, statusText: 'Server Error' });

      // Assert
      expect(result).toBeFalse();
    });
  });
});
