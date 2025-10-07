import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { ProductoDto } from './product.dto';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly apiUrl = `${environment.apiBase}productos`;

  constructor(@Inject(HttpClient) private readonly http: HttpClient) {}

  getAll(): Observable<ProductoDto[]> {
    return this.http.get<ProductoDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<ProductoDto> {
    return this.http.get<ProductoDto>(`${this.apiUrl}/${id}`);
  }

  create(producto: ProductoDto): Observable<ProductoDto> {
    return this.http.post<ProductoDto>(this.apiUrl, producto);
  }

  add(producto: ProductoDto): Observable<ProductoDto> {
    return this.create(producto);
  }

  update(producto: ProductoDto): Observable<ProductoDto> {
    if (!producto.id || producto.id <= 0) {
      throw new Error('El producto a actualizar debe tener un id válido');
    }
    return this.http.put<ProductoDto>(`${this.apiUrl}/${producto.id}`, producto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
