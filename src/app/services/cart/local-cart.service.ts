import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DetailDto } from '../detail/detail.dto';
import { ProductoDto } from '../product/product.dto';

export interface LocalCartItem {
  idProducto: number;
  producto: ProductoDto;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocalCartService {
  private readonly STORAGE_KEY = 'indukitchen_local_cart';

  // Estado interno del carrito
  private cartItems: LocalCartItem[] = [];

  // Observable para notificar cambios
  private cartItemsSubject = new BehaviorSubject<LocalCartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  // Observable para el total
  private totalSubject = new BehaviorSubject<number>(0);
  public total$ = this.totalSubject.asObservable();

  // Observable para el contador de items
  private itemCountSubject = new BehaviorSubject<number>(0);
  public itemCount$ = this.itemCountSubject.asObservable();

  constructor() {
    this.loadCartFromStorage();
    this.updateObservables();
  }

  // Cargar carrito desde localStorage
  private loadCartFromStorage(): void {
    try {
      const savedCart = localStorage.getItem(this.STORAGE_KEY);
      if (savedCart) {
        this.cartItems = JSON.parse(savedCart);
        console.log('🔄 Carrito cargado desde localStorage:', this.cartItems);
      }
    } catch (error) {
      console.error('❌ Error al cargar carrito desde localStorage:', error);
      this.cartItems = [];
    }
  }

  // Guardar carrito en localStorage
  private saveCartToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cartItems));
      console.log('💾 Carrito guardado en localStorage');
    } catch (error) {
      console.error('❌ Error al guardar carrito en localStorage:', error);
    }
  }

  // Actualizar todos los observables
  private updateObservables(): void {
    this.cartItemsSubject.next([...this.cartItems]);

    const total = this.calculateTotal();
    this.totalSubject.next(total);

    const itemCount = this.cartItems.reduce((sum, item) => sum + item.cantidad, 0);
    this.itemCountSubject.next(itemCount);

    console.log('📊 Observables actualizados - Items:', this.cartItems.length, 'Total:', total, 'Cantidad:', itemCount);
  }

  // Calcular total
  private calculateTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
  }

  // Agregar producto al carrito
  addProduct(product: ProductoDto, quantity: number = 1): boolean {
    try {
      console.log('➕ Agregando producto al carrito local:', product.nombre, 'Cantidad:', quantity);

      const existingItemIndex = this.cartItems.findIndex(item => item.idProducto === product.id);

      if (existingItemIndex >= 0) {
        // Si el producto ya existe, incrementar cantidad
        this.cartItems[existingItemIndex].cantidad += quantity;
        console.log('🔄 Cantidad actualizada para:', product.nombre, 'Nueva cantidad:', this.cartItems[existingItemIndex].cantidad);
      } else {
        // Si es un producto nuevo, agregarlo
        const newItem: LocalCartItem = {
          idProducto: product.id,
          producto: product,
          cantidad: quantity
        };
        this.cartItems.push(newItem);
        console.log('✅ Producto nuevo agregado:', product.nombre);
      }

      this.saveCartToStorage();
      this.updateObservables();
      return true;
    } catch (error) {
      console.error('❌ Error al agregar producto:', error);
      return false;
    }
  }

  // Actualizar cantidad de un producto
  updateQuantity(productId: number, newQuantity: number): boolean {
    try {
      const itemIndex = this.cartItems.findIndex(item => item.idProducto === productId);

      if (itemIndex >= 0) {
        if (newQuantity <= 0) {
          // Si la cantidad es 0 o menor, remover el producto
          return this.removeProduct(productId);
        } else {
          this.cartItems[itemIndex].cantidad = newQuantity;
          console.log('🔄 Cantidad actualizada para producto ID:', productId, 'Nueva cantidad:', newQuantity);

          this.saveCartToStorage();
          this.updateObservables();
          return true;
        }
      } else {
        console.warn('⚠️ Producto no encontrado para actualizar cantidad:', productId);
        return false;
      }
    } catch (error) {
      console.error('❌ Error al actualizar cantidad:', error);
      return false;
    }
  }

  // Remover producto del carrito
  removeProduct(productId: number): boolean {
    try {
      const initialLength = this.cartItems.length;
      this.cartItems = this.cartItems.filter(item => item.idProducto !== productId);

      if (this.cartItems.length < initialLength) {
        console.log('🗑️ Producto removido del carrito, ID:', productId);
        this.saveCartToStorage();
        this.updateObservables();
        return true;
      } else {
        console.warn('⚠️ Producto no encontrado para remover:', productId);
        return false;
      }
    } catch (error) {
      console.error('❌ Error al remover producto:', error);
      return false;
    }
  }

  // Limpiar carrito completo
  clearCart(): void {
    console.log('🧹 Limpiando carrito completo');
    this.cartItems = [];
    this.saveCartToStorage();
    this.updateObservables();
  }

  // Obtener items del carrito
  getCartItems(): LocalCartItem[] {
    return [...this.cartItems];
  }

  // Obtener total actual
  getCurrentTotal(): number {
    return this.calculateTotal();
  }

  // Obtener cantidad total de items
  getCurrentItemCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.cantidad, 0);
  }

  // Verificar si el carrito está vacío
  isEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  // Convertir carrito local a formato para backend
  toBackendFormat(): DetailDto[] {
    console.log('🔄 Convirtiendo carrito local a formato backend:', this.cartItems);

    const detalles = this.cartItems.map(item => {
      console.log('📦 Procesando item:', item);

      if (!item.idProducto || item.idProducto <= 0) {
        console.error('❌ Item sin idProducto válido:', item);
        throw new Error(`Item del carrito sin ID de producto válido: ${JSON.stringify(item)}`);
      }

      if (!item.cantidad || item.cantidad <= 0) {
        console.error('❌ Item sin cantidad válida:', item);
        throw new Error(`Item del carrito sin cantidad válida: ${JSON.stringify(item)}`);
      }

      return {
        idProducto: item.idProducto,
        cantidad: item.cantidad
        // No incluir el producto completo para simplificar
      };
    });

    console.log('✅ Detalles formateados para backend:', detalles);
    return detalles;
  }

  // Obtener datos para crear carrito en backend
  getCartDataForBackend(): any {
    return {
      detalles: this.toBackendFormat(),
      total: this.getCurrentTotal(),
      itemCount: this.getCurrentItemCount()
    };
  }
}
