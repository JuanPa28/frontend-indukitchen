import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { ClienteDto, CreateClienteBackendDto } from './client.dto';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private readonly apiUrl = `${environment.apiBase}clientes`;

  constructor(@Inject(HttpClient) private readonly http: HttpClient) {}

  // Genera una contraseña temporal fuerte (no hard-coded)
  private generateTempPassword(length: number = 16): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}';
    const array = new Uint32Array(length);
    (window.crypto || (window as any).msCrypto).getRandomValues(array);
    let pwd = '';
    for (let i = 0; i < length; i++) {
      pwd += chars[array[i] % chars.length];
    }
    return pwd;
  }

  create(cliente: ClienteDto): Observable<ClienteDto> {
    console.log('👤 Creando cliente en backend:', cliente);
    console.log('🔍 JSON que se enviará:', JSON.stringify(cliente, null, 2));

    const requiredFields = ['cedula', 'nombre', 'direccion', 'correo', 'telefono']; // ✅ SOLO campos del backend
    const missingFields = requiredFields.filter(
      (field) =>
        !(field in cliente) ||
        cliente[field as keyof ClienteDto] === undefined ||
        cliente[field as keyof ClienteDto] === null ||
        cliente[field as keyof ClienteDto] === ''
    );

    if (missingFields.length > 0) {
      console.error('❌ Campos faltantes o vacíos:', missingFields);
      console.error('❌ Objeto completo:', cliente);
    }

    console.log('🔍 Tipos de datos:');
    Object.entries(cliente).forEach(([key, value]) => {
      console.log(`  ${key}: ${typeof value} = ${value}`);
    });

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const payload: CreateClienteBackendDto = {
      ...cliente,
      disabled: false,
      locked: false,
      // Antes: 'Temporal123!' (hard-coded)
      password: this.generateTempPassword(),
    };

    console.log('📤 Headers:', headers);
    console.log('📍 URL:', this.apiUrl);
    console.log('📦 Payload final para backend:', JSON.stringify(payload, null, 2));

    return this.http.post<ClienteDto>(this.apiUrl, payload, { headers }).pipe(
      tap({
        next: (response) => {
          console.log('✅ Respuesta exitosa del backend:', response);
          console.log('✅ Respuesta completa:', JSON.stringify(response, null, 2));
        },
        error: (error) => {
          console.error('❌ Error detallado de la petición:');
          console.error('  - Status:', error.status);
          console.error('  - Status Text:', error.statusText);
          console.error('  - Error Body:', error.error);
          console.error('  - Error Message:', error.message);
          console.error('  - Headers enviados:', headers);
          console.error('  - Datos enviados:', JSON.stringify(payload, null, 2));
          console.error('  - URL:', this.apiUrl);

          if (error.error && typeof error.error === 'object') {
            console.error(
              '    - Detalles del error del backend:',
              JSON.stringify(error.error, null, 2)
            );
          }
        },
      })
    );
  }

  getByCedula(cedula: string) {
    return this.http.get<ClienteDto>(`${this.apiUrl}/${cedula}`);
  }

  update(cliente: ClienteDto): Observable<ClienteDto> {
    return this.http.put<ClienteDto>(`${this.apiUrl}/${cliente.cedula}`, cliente);
  }

  delete(cedula: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${cedula}`);
  }

  getAll(): Observable<ClienteDto[]> {
    return this.http.get<ClienteDto[]>(this.apiUrl);
  }

  existsByCedula(cedula: string) {
    return this.getByCedula(cedula).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  existsByCorreo(correo: string) {
    const email = (correo || '').trim().toLowerCase();
    return this.getAll().pipe(
      map((list) => (list || []).some((c) => (c.correo || '').trim().toLowerCase() === email)),
      catchError(() => of(false))
    );
  }
}
