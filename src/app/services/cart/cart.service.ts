import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, switchMap, catchError } from 'rxjs';
import { CartDto, ProcesarCarritoRequestDto } from './cart.dto';
import { DetailDto } from '../detail/detail.dto';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly apiUrl = `${environment.apiBase}carritos`;

  private readonly cartChangedSubject = new BehaviorSubject<boolean>(false);
  public readonly cartChanged$ = this.cartChangedSubject.asObservable();

  private readonly currentCartIdSubject = new BehaviorSubject<string | null>(null);
  public readonly currentCartId$ = this.currentCartIdSubject.asObservable();

  constructor(@Inject(HttpClient) private readonly http: HttpClient) {
    const savedCartId = localStorage.getItem('carritoId');
    if (savedCartId) {
      this.currentCartIdSubject.next(savedCartId);
    }
  }

  private notifyCartChanged(): void {
    this.cartChangedSubject.next(true);
  }

  getCurrentCartId(): string {
    let cartId = localStorage.getItem('carritoId');
    if (!cartId) {
      cartId = '1';
      localStorage.setItem('carritoId', cartId);
      this.currentCartIdSubject.next(cartId);
    }
    return cartId;
  }

  getAll(): Observable<CartDto[]> {
    return this.http.get<CartDto[]>(this.apiUrl);
  }

  getById(id: string | number) {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
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

  addDetalle(idCarrito: string, detalle: DetailDto): Observable<CartDto> {
    return this.http
      .post<CartDto>(`${this.apiUrl}/${idCarrito}/detalles`, detalle)
      .pipe(tap(() => this.notifyCartChanged()));
  }

  updateDetalle(idCarrito: string, detalle: DetailDto): Observable<CartDto> {
    return this.http
      .put<CartDto>(`${this.apiUrl}/${idCarrito}/detalles/${detalle.idProducto}`, detalle)
      .pipe(tap(() => this.notifyCartChanged()));
  }

  removeDetalle(idCarrito: string, idProducto: number): Observable<CartDto> {
    return this.http
      .delete<CartDto>(`${this.apiUrl}/${idCarrito}/detalles/${idProducto}`)
      .pipe(tap(() => this.notifyCartChanged()));
  }

  addProductToCartSimple(product: any, quantity: number = 1): Observable<CartDto> {
    console.log('🚀 Método simple: agregando producto', product.nombre);

    const detalle: DetailDto = {
      idProducto: product.id,
      cantidad: quantity,
      producto: product,
    };

    const cartId = this.getCurrentCartId();
    return this.addDetalle(cartId, detalle).pipe(
      tap((result) => {
        console.log('✅ Producto agregado con método simple:', result);
      }),
      catchError((error: any) => {
        console.log('⚠️ Error con carrito existente, creando nuevo:', error);

        const nuevoCarrito: CartDto = {
          detalles: [detalle],
        };

        return this.create(nuevoCarrito).pipe(
          tap((carrito) => {
            console.log('✅ Nuevo carrito creado exitosamente:', carrito);
            if (carrito.id) {
              localStorage.setItem('carritoId', carrito.id);
              this.currentCartIdSubject.next(carrito.id);
              this.notifyCartChanged();
            }
          }),
          catchError((createError: any) => {
            console.error('💥 Error al crear carrito:', createError);
            throw new Error(`No se pudo crear el carrito: ${createError?.message || createError}`);
          })
        );
      })
    );
  }

  addProductToCart(product: any, quantity: number = 1): Observable<CartDto> {
    console.log('🛒 Intentando agregar producto al carrito:', {
      producto: product.nombre,
      cantidad: quantity,
      productId: product.id,
    });

    const cartId = this.getCurrentCartId();
    console.log('📦 Cart ID obtenido:', cartId);

    return this.getById(cartId).pipe(
      tap((carrito) => {
        console.log('✅ Carrito encontrado:', carrito);
      }),
      switchMap((carrito: CartDto) => {
        const existingItem = carrito.detalles?.find(
          (item: DetailDto) => item.idProducto === product.id
        );

        if (existingItem) {
          console.log('🔄 Producto ya existe, actualizando cantidad:', existingItem);
          const updatedDetail: DetailDto = {
            ...existingItem,
            cantidad: existingItem.cantidad + quantity,
          };
          return this.updateDetalle(cartId, updatedDetail);
        } else {
          console.log('➕ Producto nuevo, agregando al carrito');
          const detalle: DetailDto = {
            idProducto: product.id,
            cantidad: quantity,
            producto: product,
          };
          return this.addDetalle(cartId, detalle);
        }
      }),
      catchError((error: any) => {
        console.error('❌ Error al acceder al carrito:', error);

        if (error.status === 404 || error.status === 0) {
          console.log('🆕 Creando nuevo carrito...');
          const detalle: DetailDto = {
            idProducto: product.id,
            cantidad: quantity,
            producto: product,
          };
          const nuevoCarrito: CartDto = {
            detalles: [detalle],
          };

          return this.create(nuevoCarrito).pipe(
            tap((carrito) => {
              console.log('✅ Nuevo carrito creado:', carrito);
              if (carrito.id) {
                localStorage.setItem('carritoId', carrito.id);
                this.currentCartIdSubject.next(carrito.id);
                this.notifyCartChanged();
              }
            })
          );
        }

        console.error('💥 Error no manejado:', error);
        const customError = new Error(
          `Error al agregar producto: ${error.message || 'Error desconocido'}`
        );
        (customError as any).details = {
          product: product.nombre,
          cartId: cartId,
          originalError: error,
        };
        throw customError;
      })
    );
  }

  clearCart(idCarrito?: string): Observable<void> {
    const cartId = idCarrito || this.getCurrentCartId();
    return this.delete(cartId).pipe(
      tap(() => {
        localStorage.removeItem('carritoId');
        this.currentCartIdSubject.next(null);
        this.notifyCartChanged();
      })
    );
  }

  createWithClient(cedulaCliente: string, detalles: DetailDto[]): Observable<CartDto> {
    console.log('🛒 Creando carrito en backend con cliente:', cedulaCliente);
    console.log('📋 Detalles a enviar:', detalles);

    if (!cedulaCliente || cedulaCliente.trim() === '') {
      throw new Error('La cédula del cliente es requerida');
    }

    if (!detalles || detalles.length === 0) {
      throw new Error('Los detalles del carrito son requeridos');
    }

    const productoIds = detalles.map((detalle) => detalle.idProducto);
    console.log('🏷️ IDs de productos extraídos:', productoIds);

    const createCartData = {
      idCliente: cedulaCliente.trim(),
      productoIds: productoIds,
    };

    console.log(
      '📦 Datos del carrito para backend (formato correcto):',
      JSON.stringify(createCartData, null, 2)
    );

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    return this.http.post<CartDto>(this.apiUrl, createCartData, { headers }).pipe(
      tap((carritoCreado) => {
        console.log('✅ Carrito creado exitosamente:', carritoCreado);
        if (carritoCreado.id) {
          localStorage.setItem('carritoId', carritoCreado.id);
          this.currentCartIdSubject.next(carritoCreado.id);
        }
        this.notifyCartChanged();
      }),
      catchError((error) => {
        console.error('❌ Error detallado al crear carrito:', {
          error: error,
          status: error.status,
          message: error.message,
          body: error.error,
          datosEnviados: createCartData,
        });
        throw error;
      })
    );
  }

  process(req: ProcesarCarritoRequestDto): Observable<CartDto> {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    return this.http.post<CartDto>(`${this.apiUrl}/procesar`, req, { headers }).pipe(
      tap((carrito) => {
        if (carrito?.id) {
          localStorage.setItem('carritoId', carrito.id);
          this.currentCartIdSubject.next(carrito.id);
        }
        this.notifyCartChanged();
      })
    );
  }
}
