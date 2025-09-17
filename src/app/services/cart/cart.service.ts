import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CartDto } from './cart.dto';
import { DetailDto } from '../detail/detail.dto';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private apiUrl = `${environment.apiBase}carritos`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CartDto[]> {
    return this.http.get<CartDto[]>(this.apiUrl);
  }

  getById(id: string): Observable<CartDto> {
    return this.http.get<CartDto>(`${this.apiUrl}/${id}`);
  }

  create(carrito: CartDto): Observable<CartDto> {
    return this.http.post<CartDto>(this.apiUrl, carrito);
  }

  update(carrito: CartDto): Observable<CartDto> {
    return this.http.put<CartDto>(this.apiUrl, carrito);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Métodos para manejar detalles dentro del carrito
  addDetalle(idCarrito: string, detalle: DetailDto): Observable<CartDto> {
    return this.http.post<CartDto>(`${this.apiUrl}/${idCarrito}/detalles`, detalle);
  }

  updateDetalle(idCarrito: string, detalle: DetailDto): Observable<CartDto> {
    return this.http.put<CartDto>(`${this.apiUrl}/${idCarrito}/detalles/${detalle.idProducto}`, detalle);
  }

  removeDetalle(idCarrito: string, idProducto: number): Observable<CartDto> {
    return this.http.delete<CartDto>(`${this.apiUrl}/${idCarrito}/detalles/${idProducto}`);
  }
}
