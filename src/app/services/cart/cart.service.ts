import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, switchMap, catchError } from 'rxjs';
import { CartDto, CreateCartDto } from './cart.dto';
import { DetailDto } from '../detail/detail.dto';
import { environment } from '../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private apiUrl = `${environment.apiBase}carritos`;

  // Observable para notificar cambios en el carrito
  private cartChangedSubject = new BehaviorSubject<boolean>(false);
  public cartChanged$ = this.cartChangedSubject.asObservable();

  // Observable para el carritoId actual
  private currentCartIdSubject = new BehaviorSubject<string | null>(null);
  public currentCartId$ = this.currentCartIdSubject.asObservable();

  constructor(private http: HttpClient) {
    // Inicializar el carritoId desde localStorage
    const savedCartId = localStorage.getItem('carritoId');
    if (savedCartId) {
      this.currentCartIdSubject.next(savedCartId);
    }
  }

  // Método para notificar cambios en el carrito
  private notifyCartChanged(): void {
    this.cartChangedSubject.next(true);
  }

  // Método para obtener o crear un carritoId
  getCurrentCartId(): string {
    let cartId = localStorage.getItem('carritoId');
    if (!cartId) {
      cartId = '1'; // ID por defecto, puedes cambiarlo por lógica de generación
      localStorage.setItem('carritoId', cartId);
      this.currentCartIdSubject.next(cartId);
    }
    return cartId;
  }

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
    return this.http.post<CartDto>(`${this.apiUrl}/${idCarrito}/detalles`, detalle)
      .pipe(
        tap(() => this.notifyCartChanged())
      );
  }

  updateDetalle(idCarrito: string, detalle: DetailDto): Observable<CartDto> {
    return this.http.put<CartDto>(`${this.apiUrl}/${idCarrito}/detalles/${detalle.idProducto}`, detalle)
      .pipe(
        tap(() => this.notifyCartChanged())
      );
  }

  removeDetalle(idCarrito: string, idProducto: number): Observable<CartDto> {
    return this.http.delete<CartDto>(`${this.apiUrl}/${idCarrito}/detalles/${idProducto}`)
      .pipe(
        tap(() => this.notifyCartChanged())
      );
  }

  // Método alternativo más simple para agregar productos
  addProductToCartSimple(product: any, quantity: number = 1): Observable<CartDto> {
    console.log('🚀 Método simple: agregando producto', product.nombre);

    const detalle: DetailDto = {
      idProducto: product.id,
      cantidad: quantity,
      producto: product
    };

    // Intentar agregar directamente al carrito existente
    const cartId = this.getCurrentCartId();
    return this.addDetalle(cartId, detalle).pipe(
      tap(result => {
        console.log('✅ Producto agregado con método simple:', result);
      }),
      catchError((error: any) => {
        console.log('⚠️ Error con carrito existente, creando nuevo:', error);

        // Si falla, crear un carrito nuevo
        const nuevoCarrito: CartDto = {
          detalles: [detalle]
        };

        return this.create(nuevoCarrito).pipe(
          tap(carrito => {
            console.log('✅ Nuevo carrito creado exitosamente:', carrito);
            if (carrito.id) {
              localStorage.setItem('carritoId', carrito.id);
              this.currentCartIdSubject.next(carrito.id);
              this.notifyCartChanged();
            }
          }),
          catchError((createError: any) => {
            console.error('💥 Error al crear carrito:', createError);
            throw {
              message: 'No se pudo crear el carrito',
              originalError: createError,
              details: { product: product.nombre }
            };
          })
        );
      })
    );
  }

  // Método mejorado para agregar productos al carrito
  addProductToCart(product: any, quantity: number = 1): Observable<CartDto> {
    console.log('🛒 Intentando agregar producto al carrito:', {
      producto: product.nombre,
      cantidad: quantity,
      productId: product.id
    });

    const cartId = this.getCurrentCartId();
    console.log('📦 Cart ID obtenido:', cartId);

    // Primero verificar si el carrito ya existe
    return this.getById(cartId).pipe(
      tap(carrito => {
        console.log('✅ Carrito encontrado:', carrito);
      }),
      switchMap((carrito: CartDto) => {
        const existingItem = carrito.detalles?.find((item: DetailDto) => item.idProducto === product.id);

        if (existingItem) {
          console.log('🔄 Producto ya existe, actualizando cantidad:', existingItem);
          // Si el producto ya existe, actualizar la cantidad
          const updatedDetail: DetailDto = {
            ...existingItem,
            cantidad: existingItem.cantidad + quantity
          };
          return this.updateDetalle(cartId, updatedDetail);
        } else {
          console.log('➕ Producto nuevo, agregando al carrito');
          // Si es un producto nuevo, agregarlo
          const detalle: DetailDto = {
            idProducto: product.id,
            cantidad: quantity,
            producto: product
          };
          return this.addDetalle(cartId, detalle);
        }
      }),
      catchError((error: any) => {
        console.error('❌ Error al acceder al carrito:', error);

        // Si el carrito no existe (404) o cualquier otro error, crear uno nuevo
        if (error.status === 404 || error.status === 0) {
          console.log('🆕 Creando nuevo carrito...');
          const detalle: DetailDto = {
            idProducto: product.id,
            cantidad: quantity,
            producto: product
          };
          const nuevoCarrito: CartDto = {
            detalles: [detalle]
          };

          return this.create(nuevoCarrito).pipe(
            tap(carrito => {
              console.log('✅ Nuevo carrito creado:', carrito);
              if (carrito.id) {
                localStorage.setItem('carritoId', carrito.id);
                this.currentCartIdSubject.next(carrito.id);
                this.notifyCartChanged();
              }
            })
          );
        }

        // Para otros errores, re-lanzar el error con más información
        console.error('💥 Error no manejado:', error);
        throw {
          ...error,
          message: `Error al agregar producto: ${error.message || 'Error desconocido'}`,
          details: {
            product: product.nombre,
            cartId: cartId,
            originalError: error
          }
        };
      })
    );
  }

  // Método para limpiar el carrito completo
  clearCart(idCarrito?: string): Observable<void> {
    const cartId = idCarrito || this.getCurrentCartId();
    return this.delete(cartId)
      .pipe(
        tap(() => {
          localStorage.removeItem('carritoId');
          this.currentCartIdSubject.next(null);
          this.notifyCartChanged();
        })
      );
  }

  // Método específico para crear carrito con cliente
  createWithClient(cedulaCliente: string, detalles: DetailDto[]): Observable<CartDto> {
    console.log('🛒 Creando carrito en backend con cliente:', cedulaCliente);
    console.log('📋 Detalles a enviar:', detalles);

    // Validaciones antes de enviar
    if (!cedulaCliente || cedulaCliente.trim() === '') {
      throw new Error('La cédula del cliente es requerida');
    }

    if (!detalles || detalles.length === 0) {
      throw new Error('Los detalles del carrito son requeridos');
    }

    // Extraer solo los IDs de productos
    const productoIds = detalles.map(detalle => detalle.idProducto);
    console.log('🏷️ IDs de productos extraídos:', productoIds);

    // Crear carrito con la estructura que espera el backend: idCliente y productoIds
    const createCartData = {
      idCliente: cedulaCliente.trim(),  // Backend espera idCliente, no cedula_cliente
      productoIds: productoIds          // Backend espera array de IDs de productos
    };

    console.log('📦 Datos del carrito para backend (formato correcto):', JSON.stringify(createCartData, null, 2));

    // Agregar headers específicos para asegurar el content-type
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    return this.http.post<CartDto>(this.apiUrl, createCartData, { headers }).pipe(
      tap(carritoCreado => {
        console.log('✅ Carrito creado exitosamente:', carritoCreado);
        if (carritoCreado.id) {
          localStorage.setItem('carritoId', carritoCreado.id);
          this.currentCartIdSubject.next(carritoCreado.id);
        }
        this.notifyCartChanged();
      }),
      catchError(error => {
        console.error('❌ Error detallado al crear carrito:', {
          error: error,
          status: error.status,
          message: error.message,
          body: error.error,
          datosEnviados: createCartData
        });
        throw error;
      })
    );
  }
}
