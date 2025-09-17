import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductoDto } from '../../services/product/product.dto';
import { ProductoService } from '../../services/product/product.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit {
  products: ProductoDto[] = [];
  filteredProducts: ProductoDto[] = [];
  categories: string[] = [];

  // Filtros y búsqueda
  searchTerm: string = '';
  selectedCategory: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalPages: number = 1;

  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(private readonly productoService: ProductoService) {}

  ngOnInit(): void {
    this.loadProducts();
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
    console.log('Producto agregado al carrito:', product);
    alert(`¡${product.nombre} agregado al carrito!`);
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
