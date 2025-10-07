import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FacturaDto, CreateFacturaDto } from './factura.dto';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private readonly apiUrl = `${environment.apiBase}facturas`;

  constructor(@Inject(HttpClient) private readonly http: HttpClient) {}

  createFromCarrito(idCarrito: string): Observable<FacturaDto> {
    console.log('🧾 Creando factura para carrito:', idCarrito);

    const createFacturaData: CreateFacturaDto = {
      idCarrito: idCarrito,
    };

    console.log('📄 Datos para crear factura:', JSON.stringify(createFacturaData, null, 2));

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    return this.http.post<FacturaDto>(this.apiUrl, createFacturaData, { headers });
  }

  getById(id: string): Observable<FacturaDto> {
    return this.http.get<FacturaDto>(`${this.apiUrl}/${id}`);
  }

  getAll(): Observable<FacturaDto[]> {
    return this.http.get<FacturaDto[]>(this.apiUrl);
  }

  sendByEmail(idFactura: string): Observable<any> {
    console.log('📧 Enviando factura por email:', idFactura);

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    return this.http.post<any>(`${this.apiUrl}/${idFactura}/email`, {}, { headers });
  }

  getPdfBlob(idFactura: string | number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${idFactura}/pdf`, { responseType: 'blob' as const });
  }

  openPdfInNewTab(idFactura: string | number): void {
    window.open(`${this.apiUrl}/${idFactura}/pdf`, '_blank');
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
