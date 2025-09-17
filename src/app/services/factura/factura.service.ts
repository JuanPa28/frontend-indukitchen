import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FacturaDto, CreateFacturaDto } from './factura.dto';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private apiUrl = `${environment.apiBase}facturas`;

  constructor(private http: HttpClient) {}

  // Crear factura a partir de un carrito
  createFromCarrito(idCarrito: string): Observable<FacturaDto> {
    console.log('🧾 Creando factura para carrito:', idCarrito);

    const createFacturaData: CreateFacturaDto = {
      idCarrito: idCarrito
    };

    console.log('📄 Datos para crear factura:', JSON.stringify(createFacturaData, null, 2));

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    return this.http.post<FacturaDto>(this.apiUrl, createFacturaData, { headers });
  }

  // Obtener factura por ID
  getById(id: string): Observable<FacturaDto> {
    return this.http.get<FacturaDto>(`${this.apiUrl}/${id}`);
  }

  // Obtener todas las facturas
  getAll(): Observable<FacturaDto[]> {
    return this.http.get<FacturaDto[]>(this.apiUrl);
  }

  // Enviar factura por correo electrónico
  sendByEmail(idFactura: string): Observable<any> {
    console.log('📧 Enviando factura por email:', idFactura);

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    return this.http.post<any>(`${this.apiUrl}/${idFactura}/email`, {}, { headers });
  }
}
