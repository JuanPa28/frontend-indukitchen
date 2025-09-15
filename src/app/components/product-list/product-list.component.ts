import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  isActive: boolean;
  rating?: number;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: string[] = [];
  
  // Filtros y búsqueda
  searchTerm: string = '';
  selectedCategory: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalPages: number = 1;

  isLoading: boolean = true;
  errorMessage: string = '';

  constructor() {}

  ngOnInit(): void {
    // Simulamos un tiempo de carga
    setTimeout(() => {
      this.loadProducts();
    }, 1000);
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      // Usamos datos de ejemplo directamente
      this.products = this.getSampleProducts();
      this.filteredProducts = [...this.products];
      this.extractCategories();
      this.calculatePagination();
      this.isLoading = false;
    } catch (error) {
      this.errorMessage = 'Error cargando productos de demostración';
      this.isLoading = false;
      console.error('Error loading products:', error);
    }
  }

  // Datos de ejemplo mejorados
  private getSampleProducts(): Product[] {
    return [
      {
        _id: '1',
        name: 'Batidora de Varilla Profesional',
        description: 'Batidora de varilla con 5 velocidades, potencia 250W. Ideal para mezclas, batidos y amasados. Perfecta para repostería y cocina profesional.',
        price: 129900,
        stock: 15,
        category: 'electrodomesticos',
        imageUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1b5a2a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true,
        rating: 4.5
      },
      {
        _id: '2',
        name: 'Juego de Cuchillos Profesional',
        description: 'Set de 5 cuchillos de acero inoxidable con bloc de madera. Incluye cuchillo chef, pelador, cuchillo para pan, cuchillo deshuesador y cuchillo de uso general.',
        price: 189900,
        stock: 8,
        category: 'cuchillos',
        imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true,
        rating: 4.8
      },
      {
        _id: '3',
        name: 'Sartén Antiadherente 28cm',
        description: 'Sartén con revestimiento cerámico antiadherente, libre de PFOA. Aptas para todo tipo de cocinas, incluyendo inducción. Mango ergonómico resistente al calor.',
        price: 79900,
        stock: 3,
        category: 'utensilios',
        imageUrl: 'https://images.unsplash.com/photo-1583778176476-4a8b8dc563ce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true,
        rating: 4.2
      },
      {
        _id: '4',
        name: 'Báscula Digital Precision',
        description: 'Báscula digital con capacidad de 5kg y precisión de 1g. Pantalla LCD y funciones tara y autoapagado. Ideal para repostería y dietas.',
        price: 45900,
        stock: 22,
        category: 'utensilios',
        imageUrl: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true,
        rating: 4.7
      },
      {
        _id: '5',
        name: 'Horno Toaster Digital',
        description: 'Horno toaster con capacidad de 25L, función de convección y control digital de temperatura. Perfecto para asar, tostar y hornear pequeñas porciones.',
        price: 239900,
        stock: 6,
        category: 'electrodomesticos',
        imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true,
        rating: 4.3
      },
      {
        _id: '6',
        name: 'Juego de Bowls de Preparación',
        description: 'Set de 5 bowls de vidrio refractario con tapas, ideales para preparar y almacenar alimentos. Aptos para microondas, lavavajillas y freezer.',
        price: 89900,
        stock: 14,
        category: 'almacenamiento',
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true,
        rating: 4.6
      },
      {
        _id: '7',
        name: 'Olla Arrocera Programable',
        description: 'Olla arrocera con capacidad para 10 tazas y panel de control digital. Incluye funciones para cocinar arroz blanco, integral y al vapor.',
        price: 149900,
        stock: 0,
        category: 'electrodomesticos',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true,
        rating: 4.1
      },
      {
        _id: '8',
        name: 'Set de Utensilios de Silicona',
        description: 'Set de 8 utensilios de silicona aptos para todo tipo de ollas y sartenes. Incluye espátulas, cucharas y batidor. Resistente a altas temperaturas.',
        price: 65900,
        stock: 18,
        category: 'utensilios',
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true,
        rating: 4.4
      },
      {
        _id: '9',
        name: 'Cafetera Expresso Premium',
        description: 'Cafetera expresso automática con molinillo integrado. Prepara café con calidad de barista en tu hogar.',
        price: 359900,
        stock: 4,
        category: 'electrodomesticos',
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true,
        rating: 4.9
      },
      {
        _id: '10',
        name: 'Tabla de Picar Bambú',
        description: 'Tabla de picar de bambú ecológico, antibacteriana y resistente. Ideal para todo tipo de alimentos.',
        price: 34900,
        stock: 25,
        category: 'utensilios',
        imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true,
        rating: 4.0
      }
    ];
  }

  private extractCategories(): void {
    const uniqueCategories = new Set(this.products.map(product => product.category));
    this.categories = Array.from(uniqueCategories);
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Filtrar por búsqueda
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por categoría
    if (this.selectedCategory) {
      filtered = filtered.filter(product => product.category === this.selectedCategory);
    }

    this.filteredProducts = filtered;
    this.currentPage = 1;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
  }

  get paginatedProducts(): Product[] {
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

  addToCart(product: Product): void {
    console.log('Producto agregado al carrito:', product);
    // Aquí puedes agregar lógica para el carrito de compras
    alert(`¡${product.name} agregado al carrito!`);
  }

  viewDetails(product: Product): void {
    console.log('Ver detalles del producto:', product);
    // Aquí puedes implementar la navegación a la página de detalles
    alert(`Redirigiendo a detalles de: ${product.name}`);
  }

  handleImageError(event: any): void {
    // Imagen placeholder en base64 para evitar errores 404
    const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhjY2NjIiBvcGFjaXR5PSIwLjMiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNzc3Nzc3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zNWVtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+';
    event.target.src = placeholder;
  }

  getCategoryDisplayName(category: string): string {
    const categoryNames: {[key: string]: string} = {
      'electrodomesticos': 'Electrodomésticos',
      'cuchillos': 'Cuchillos',
      'utensilios': 'Utensilios',
      'almacenamiento': 'Almacenamiento'
    };
    return categoryNames[category] || category;
  }

  // Pipe personalizado para truncar texto
  truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}