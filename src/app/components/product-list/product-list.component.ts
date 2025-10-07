import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductoDto } from '../../services/product/product.dto';
import { ProductoService } from '../../services/product/product.service';
import { LocalCartService } from '../../services/cart/local-cart.service';
import { HelloService } from '../../services/hello/hello.service';
import { AiChatComponent } from '../ai-chat/ai-chat.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AiChatComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit {
  products: ProductoDto[] = [];
  filteredProducts: ProductoDto[] = [];
  categories: string[] = [];

  searchTerm: string = '';
  selectedCategory: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalPages: number = 1;

  isLoading: boolean = true;
  errorMessage: string = '';

  greetingMessage: string = '';
  isLoadingGreeting: boolean = true;

  constructor(
    private readonly productoService: ProductoService,
    private readonly localCartService: LocalCartService,
    private readonly helloService: HelloService
  ) {}

  ngOnInit(): void {
    this.loadGreeting();
    this.loadProducts();
  }

  loadGreeting(): void {
    this.isLoadingGreeting = true;
    this.helloService.getPersonalizedGreeting().subscribe({
      next: (greeting) => {
        this.greetingMessage = greeting;
        this.isLoadingGreeting = false;
      },
      error: (error) => {
        console.error('Error cargando saludo:', error);
        this.greetingMessage =
          '¡Bienvenido a IndukItchen! Descubre nuestros mejores productos para tu hogar.';
        this.isLoadingGreeting = false;
      },
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.productoService
      .getAll()
      .pipe(
        catchError((error) => {
          this.errorMessage = 'Error cargando productos del backend';
          this.isLoading = false;
          console.error('Error loading products:', error && (error.message || error));
          return of([] as ProductoDto[]);
        })
      )
      .subscribe((productos) => {
        this.products = productos;
        this.filteredProducts = [...productos];
        this.calculatePagination();
        this.isLoading = false;
      });
  }

  extractCategories(): void {
    this.categories = [];
  }

  applyFilters(): void {
    let filtered = [...this.products];

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.nombre.toLowerCase().includes(searchLower) ||
          product.descripcion.toLowerCase().includes(searchLower)
      );
    }

    this.filteredProducts = filtered;
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  get paginatedProducts(): ProductoDto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(startIndex, startIndex + this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  addToCart(product: ProductoDto): void {
    console.log('🛍️ Agregando producto al carrito local:', product.nombre);
    window.alert('Producto agregado');
    const success = this.localCartService.addProduct(product, 1);

    if (success) {
      console.log('✅ Producto agregado exitosamente al carrito local');
      this.showSuccessMessage(product.nombre);
    } else {
      console.error('❌ Error al agregar producto al carrito local');
      this.showErrorMessage('Error al agregar el producto al carrito');
    }
  }

  private showSuccessMessage(productName: string): void {
    const message = document.createElement('div');
    message.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #059669, #10b981);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-weight: 600;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">✅</span>
          <span>¡${productName} agregado al carrito!</span>
        </div>
      </div>
    `;

    if (!document.getElementById('toast-styles')) {
      const styles = document.createElement('style');
      styles.id = 'toast-styles';
      styles.innerHTML = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(message);

    setTimeout(() => {
      if (message.parentNode) {
        message.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          if (message.parentNode) {
            message.parentNode.removeChild(message);
          }
        }, 300);
      }
    }, 3000);
  }

  private showErrorMessage(errorText: string): void {
    const message = document.createElement('div');
    message.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #dc2626, #ef4444);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-weight: 600;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 20px;">❌</span>
          <span>${errorText}</span>
        </div>
      </div>
    `;

    document.body.appendChild(message);

    setTimeout(() => {
      if (message.parentNode) {
        message.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
          if (message.parentNode) {
            message.parentNode.removeChild(message);
          }
        }, 300);
      }
    }, 3000);
  }

  viewDetails(product: ProductoDto): void {
    console.log('Ver detalles del producto:', product);
    alert(`Redirigiendo a detalles de: ${product.nombre}`);
  }

  handleImageError(event: any): void {
    const placeholder =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhjY2NjIiBvcGFjaXR5PSIwLjMiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNzc3Nzc3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zNWVtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+';
    event.target.src = placeholder;
  }

  getCategoryDisplayName(category: string): string {
    return category;
  }

  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
