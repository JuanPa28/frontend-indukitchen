import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { UserPreferences, SuggestionResponse } from './suggestion.dto';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class SuggestionService {
  private readonly apiUrl = `${environment.apiBase}productos/suggest`;

  constructor(private readonly http: HttpClient) {}

  getSuggestions(userPreferences: string): Observable<SuggestionResponse> {
    console.log('🤖 Solicitando sugerencias de IA:', userPreferences);

    const requestData: UserPreferences = {
      userPreferences: userPreferences,
    };

    console.log('📤 Datos enviados a IA:', JSON.stringify(requestData, null, 2));

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'text/plain',
    };

    return this.http
      .post(this.apiUrl, requestData, {
        headers,
        responseType: 'text',
      })
      .pipe(
        map((textResponse: string) => {
          console.log('📥 Respuesta de texto recibida:', textResponse);

          try {
            const jsonResponse = JSON.parse(textResponse);
            console.log('✅ Respuesta parseada como JSON:', jsonResponse);
            return jsonResponse as SuggestionResponse;
          } catch (jsonError) {
            console.error('📝 Error al parsear la respuesta como JSON:', jsonError);
            console.log('📝 Respuesta es texto plano, creando objeto de respuesta');
            return {
              message: textResponse,
              suggestions: [],
            } as SuggestionResponse;
          }
        }),
        catchError((error: any) => {
          console.error('❌ Error detallado en getSuggestions:', error);

          if (error.error && typeof error.error === 'string') {
            console.log('📝 Usando texto del error como respuesta');
            return of({
              message: error.error,
              suggestions: [],
            } as SuggestionResponse);
          }

          return of({
            message:
              'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta con una descripción diferente.',
            suggestions: [],
          } as SuggestionResponse);
        })
      );
  }
}
