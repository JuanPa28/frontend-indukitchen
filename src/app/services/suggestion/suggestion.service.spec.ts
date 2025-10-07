import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SuggestionService } from './suggestion.service';
import { SuggestionResponse } from './suggestion.dto';
import { environment } from '../../../environments/environments';

describe('SuggestionService', () => {
  let service: SuggestionService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiBase}productos/suggest`;

  const expectSuggestion = (res: SuggestionResponse) => ({
    toHaveMessageContaining(text: string) {
      expect(res.message ?? '').toContain(text);
      return this;
    },
    toHaveSuggestionsCount(n: number) {
      expect((res.suggestions ?? []).length).toBe(n);
      return this;
    },
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SuggestionService],
    });
    service = TestBed.inject(SuggestionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debería POSTear con headers y responseType text, parseando JSON válido', () => {
    // Arrange
    const prefs = 'ollas y sartenes';
    const payload: SuggestionResponse = {
      message: 'Sugerencias encontradas',
      suggestions: [{ nombre: 'Olla' }],
    };
    let result: SuggestionResponse | undefined;

    // Act
    service.getSuggestions(prefs).subscribe((res) => (result = res));

    // Assert (request)
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Accept')).toBe('text/plain');
    expect(req.request.responseType).toBe('text');

    req.flush(JSON.stringify(payload));

    // Assert (response)
    expect(result).toEqual(payload);
    expectSuggestion(result as SuggestionResponse).toHaveMessageContaining('Sugerencias');
  });

  it('debería convertir texto plano no-JSON en { message, suggestions: [] }', () => {
    // Arrange
    const prefs = 'licuadoras';
    const plainText = 'Top 3 licuadoras: X, Y, Z';
    let result: SuggestionResponse | undefined;

    // Act
    service.getSuggestions(prefs).subscribe((res) => (result = res));

    // Assert (request)
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');

    req.flush(plainText);

    // Assert (response)
    expectSuggestion(result as SuggestionResponse)
      .toHaveMessageContaining('Top 3 licuadoras')
      .toHaveSuggestionsCount(0);
  });

  it('debería mapear error.error string a { message: error.error, suggestions: [] }', () => {
    // Arrange
    const prefs = 'cafeteras';
    let result: SuggestionResponse | undefined;

    // Act
    service.getSuggestions(prefs).subscribe((res) => (result = res));

    // Assert (request)
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');

    req.flush('backend textual error', { status: 400, statusText: 'Bad Request' });

    // Assert (response)
    expectSuggestion(result as SuggestionResponse)
      .toHaveMessageContaining('backend textual error')
      .toHaveSuggestionsCount(0);
  });

  it('debería devolver mensaje por defecto cuando error.error no es string', () => {
    // Arrange
    const prefs = 'sartenes';
    let result: SuggestionResponse | undefined;

    // Act
    service.getSuggestions(prefs).subscribe((res) => (result = res));

    // Assert (request)
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');

    req.error(new ErrorEvent('NetworkError', { message: 'boom' }), {
      status: 500,
      statusText: 'Server Error',
    });

    // Assert (response)
    expect((result as SuggestionResponse).message).toContain(
      'Lo siento, hubo un error al procesar tu solicitud'
    );
    expectSuggestion(result as SuggestionResponse).toHaveSuggestionsCount(0);
  });
});
