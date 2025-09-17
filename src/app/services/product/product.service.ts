import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductoDto } from './product.dto';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly apiUrl = `${environment.apiBase}productos`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ProductoDto[]> {
    return this.http.get<ProductoDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<ProductoDto> {
    return this.http.get<ProductoDto>(`${this.apiUrl}/${id}`);
  }

  add(producto: ProductoDto): Observable<ProductoDto> {
    return this.http.post<ProductoDto>(this.apiUrl, producto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
