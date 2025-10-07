import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DetailDto } from '../detail/detail.dto';
import { ProductoDto } from '../product/product.dto';

export interface LocalCartItem {
  idProducto: number;
  producto: ProductoDto;
  cantidad: number;
}

@Injectable({
  providedIn: 'root',
})
export class LocalCartService {
  private readonly STORAGE_KEY = 'indukitchen_local_cart';

  private cartItems: LocalCartItem[] = [];

  private readonly cartItemsSubject = new BehaviorSubject<LocalCartItem[]>([]);
  public readonly cartItems$ = this.cartItemsSubject.asObservable();

  private readonly totalSubject = new BehaviorSubject<number>(0);
  public readonly total$ = this.totalSubject.asObservable();

  private readonly itemCountSubject = new BehaviorSubject<number>(0);
  public readonly itemCount$ = this.itemCountSubject.asObservable();

  constructor() {
    this.loadCartFromStorage();
    this.updateObservables();
  }

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

  private saveCartToStorage(): boolean {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cartItems));
      console.log('💾 Carrito guardado en localStorage');
      return true;
    } catch (error) {
      console.error('❌ Error al guardar carrito en localStorage:', error);
      return false;
    }
  }

  private updateObservables(): void {
    this.cartItemsSubject.next([...this.cartItems]);

    const total = this.calculateTotal();
    this.totalSubject.next(total);

    const itemCount = this.cartItems.reduce((sum, item) => sum + item.cantidad, 0);
    this.itemCountSubject.next(itemCount);

    console.log(
      '📊 Observables actualizados - Items:',
      this.cartItems.length,
      'Total:',
      total,
      'Cantidad:',
      itemCount
    );
  }

  private calculateTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0);
  }

  addProduct(product: ProductoDto, quantity: number = 1): boolean {
    try {
      console.log('➕ Agregando producto al carrito local:', product.nombre, 'Cantidad:', quantity);

      const existingItemIndex = this.cartItems.findIndex((item) => item.idProducto === product.id);

      if (existingItemIndex >= 0) {
        this.cartItems[existingItemIndex].cantidad += quantity;
        console.log(
          '🔄 Cantidad actualizada para:',
          product.nombre,
          'Nueva cantidad:',
          this.cartItems[existingItemIndex].cantidad
        );
      } else {
        const newItem: LocalCartItem = {
          idProducto: product.id,
          producto: product,
          cantidad: quantity,
        };
        this.cartItems.push(newItem);
        console.log('✅ Producto nuevo agregado:', product.nombre);
      }

      const saved = this.saveCartToStorage();
      if (!saved) return false;

      this.updateObservables();
      return true;
    } catch (error) {
      console.error('❌ Error al agregar producto:', error);
      return false;
    }
  }

  updateQuantity(productId: number, newQuantity: number): boolean {
    try {
      const itemIndex = this.cartItems.findIndex((item) => item.idProducto === productId);

      if (itemIndex >= 0) {
        if (newQuantity <= 0) {
          return this.removeProduct(productId);
        } else {
          this.cartItems[itemIndex].cantidad = newQuantity;
          console.log(
            '🔄 Cantidad actualizada para producto ID:',
            productId,
            'Nueva cantidad:',
            newQuantity
          );

          const saved = this.saveCartToStorage();
          if (!saved) return false;

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

  removeProduct(productId: number): boolean {
    try {
      const initialLength = this.cartItems.length;
      this.cartItems = this.cartItems.filter((item) => item.idProducto !== productId);

      if (this.cartItems.length < initialLength) {
        console.log('🗑️ Producto removido del carrito, ID:', productId);

        const saved = this.saveCartToStorage();
        if (!saved) return false;

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

  clearCart(): void {
    console.log('🧹 Limpiando carrito completo');
    this.cartItems = [];
    this.saveCartToStorage();
    this.updateObservables();
  }

  getCartItems(): LocalCartItem[] {
    return [...this.cartItems];
  }

  getCurrentTotal(): number {
    return this.calculateTotal();
  }

  getCurrentItemCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.cantidad, 0);
  }

  isEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  toBackendFormat(): DetailDto[] {
    console.log('🔄 Convirtiendo carrito local a formato backend:', this.cartItems);

    const detalles = this.cartItems.map((item) => {
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
        cantidad: item.cantidad,
      };
    });

    console.log('✅ Detalles formateados para backend:', detalles);
    return detalles;
  }

  getCartDataForBackend(): any {
    return {
      detalles: this.toBackendFormat(),
      total: this.getCurrentTotal(),
      itemCount: this.getCurrentItemCount(),
    };
  }
}
