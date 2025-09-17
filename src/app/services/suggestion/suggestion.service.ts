import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { UserPreferences, SuggestionResponse } from './suggestion.dto';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class SuggestionService {
  private apiUrl = `${environment.apiBase}productos/suggest`;

  constructor(private http: HttpClient) {}

  // Obtener sugerencias basadas en preferencias del usuario
  getSuggestions(userPreferences: string): Observable<SuggestionResponse> {
    console.log('🤖 Solicitando sugerencias de IA:', userPreferences);

    const requestData: UserPreferences = {
      userPreferences: userPreferences
    };

    console.log('📤 Datos enviados a IA:', JSON.stringify(requestData, null, 2));

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'text/plain' // Cambiar a text/plain ya que el backend devuelve texto
    };

    // Hacer la petición esperando texto plano
    return this.http.post(this.apiUrl, requestData, {
      headers,
      responseType: 'text' // Especificar que esperamos texto
    }).pipe(
      map((textResponse: string) => {
        console.log('📥 Respuesta de texto recibida:', textResponse);

        // Intentar parsear como JSON primero
        try {
          const jsonResponse = JSON.parse(textResponse);
          console.log('✅ Respuesta parseada como JSON:', jsonResponse);
          return jsonResponse as SuggestionResponse;
        } catch (jsonError) {
          console.log('📝 Respuesta es texto plano, creando objeto de respuesta');
          // Si no es JSON, crear un objeto de respuesta con el texto
          return {
            message: textResponse,
            suggestions: [] // Sin sugerencias estructuradas por ahora
          } as SuggestionResponse;
        }
      }),
      catchError((error: any) => {
        console.error('❌ Error detallado en getSuggestions:', error);

        // Si hay texto en el error, intentar usarlo
        if (error.error && typeof error.error === 'string') {
          console.log('📝 Usando texto del error como respuesta');
          return of({
            message: error.error,
            suggestions: []
          } as SuggestionResponse);
        }

        // Error genérico
        return of({
          message: 'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta con una descripción diferente.',
          suggestions: []
        } as SuggestionResponse);
      })
    );
  }
}
