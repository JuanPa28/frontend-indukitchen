import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class HelloService {
  private readonly apiUrl = `${environment.apiBase}hello`;

  constructor(private readonly http: HttpClient) {}

  getPersonalizedGreeting(): Observable<string> {
    console.log('👋 Solicitando saludo personalizado de IA');

    const headers = {
      Accept: 'text/plain',
    };

    return this.http
      .get(this.apiUrl, {
        headers,
        responseType: 'text',
      })
      .pipe(
        map((textResponse: string) => {
          console.log('✅ Saludo recibido:', textResponse);
          return textResponse;
        }),
        catchError((error: any) => {
          console.error('❌ Error al obtener saludo:', error);

          return of(
            '¡Bienvenido a IndukItchen! Descubre nuestros mejores productos para tu hogar.'
          );
        })
      );
  }
}
