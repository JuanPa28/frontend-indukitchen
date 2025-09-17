import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClienteDto } from './client.dto';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = `${environment.apiBase}clientes`;

  constructor(private http: HttpClient) {}

  // Crear cliente
  create(cliente: ClienteDto): Observable<ClienteDto> {
    console.log('👤 Creando cliente en backend:', cliente);
    return this.http.post<ClienteDto>(this.apiUrl, cliente);
  }

  // Obtener cliente por cédula
  getByCedula(cedula: string): Observable<ClienteDto> {
    return this.http.get<ClienteDto>(`${this.apiUrl}/${cedula}`);
  }

  // Actualizar cliente
  update(cliente: ClienteDto): Observable<ClienteDto> {
    return this.http.put<ClienteDto>(`${this.apiUrl}/${cliente.cedula}`, cliente);
  }

  // Eliminar cliente
  delete(cedula: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${cedula}`);
  }

  // Obtener todos los clientes
  getAll(): Observable<ClienteDto[]> {
    return this.http.get<ClienteDto[]>(this.apiUrl);
  }
}
