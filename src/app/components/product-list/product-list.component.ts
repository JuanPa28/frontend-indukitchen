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
  image: string;
  isActive: boolean;
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
  
  // Filtros
  selectedCategory: string = 'all';
  sortOrder: string = 'name';

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
      this.isLoading = false;
    } catch (error) {
      this.errorMessage = 'Error cargando productos de demostración';
      this.isLoading = false;
      console.error('Error loading products:', error);
    }
  }

  // Datos de ejemplo
  private getSampleProducts(): Product[] {
    return [
      {
        _id: '1',
        name: 'Batidora de Varilla Profesional',
        description: 'Batidora de varilla con 5 velocidades, potencia 250W. Ideal para mezclas, batidos y amasados. Perfecta para repostería y cocina profesional.',
        price: 129900,
        stock: 15,
        category: 'electrodomesticos',
        image: 'https://images.unsplash.com/photo-1567401893414-76b7b1b5a2a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true
      },
      {
        _id: '2',
        name: 'Juego de Cuchillos Profesional',
        description: 'Set de 5 cuchillos de acero inoxidable con bloc de madera. Incluye cuchillo chef, pelador, cuchillo para pan, cuchillo deshuesador y cuchillo de uso general.',
        price: 189900,
        stock: 8,
        category: 'cuchillos',
        image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true
      },
      {
        _id: '3',
        name: 'Sartén Antiadherente 28cm',
        description: 'Sartén con revestimiento cerámico antiadherente, libre de PFOA. Aptas para todo tipo de cocinas, incluyendo inducción. Mango ergonómico resistente al calor.',
        price: 79900,
        stock: 3,
        category: 'utensilios',
        image: 'https://images.unsplash.com/photo-1583778176476-4a8b8dc563ce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true
      },
      {
        _id: '4',
        name: 'Báscula Digital Precision',
        description: 'Báscula digital con capacidad de 5kg y precisión de 1g. Pantalla LCD y funciones tara y autoapagado. Ideal para repostería y dietas.',
        price: 45900,
        stock: 22,
        category: 'utensilios',
        image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true
      },
      {
        _id: '5',
        name: 'Horno Toaster Digital',
        description: 'Horno toaster con capacidad de 25L, función de convección y control digital de temperatura. Perfecto para asar, tostar y hornear pequeñas porciones.',
        price: 239900,
        stock: 6,
        category: 'electrodomesticos',
        image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true
      },
      {
        _id: '6',
        name: 'Juego de Bowls de Preparación',
        description: 'Set de 5 bowls de vidrio refractario con tapas, ideales para preparar y almacenar alimentos. Aptos para microondas, lavavajillas y freezer.',
        price: 89900,
        stock: 14,
        category: 'almacenamiento',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true
      },
      {
        _id: '7',
        name: 'Olla Arrocera Programable',
        description: 'Olla arrocera con capacidad para 10 tazas y panel de control digital. Incluye funciones para cocinar arroz blanco, integral y al vapor.',
        price: 149900,
        stock: 0,
        category: 'electrodomesticos',
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true
      },
      {
        _id: '8',
        name: 'Set de Utensilios de Silicona',
        description: 'Set de 8 utensilios de silicona aptos para todo tipo de ollas y sartenes. Incluye espátulas, cucharas y batidor. Resistente a altas temperaturas.',
        price: 65900,
        stock: 18,
        category: 'utensilios',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        isActive: true
      }
    ];
  }

  private extractCategories(): void {
    const uniqueCategories = new Set(this.products.map(product => product.category));
    this.categories = ['all', ...Array.from(uniqueCategories)];
  }

  applyFilters(): void {
    let filtered = [...this.products];

    // Filtrar por categoría
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === this.selectedCategory);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (this.sortOrder) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    this.filteredProducts = filtered;
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  addToCart(product: Product): void {
    console.log('Producto agregado al carrito:', product);
    // Aquí puedes agregar lógica para el carrito de compras
    alert(`¡${product.name} agregado al carrito!`);
  }

  addToFavorites(product: Product): void {
    console.log('Producto agregado a favoritos:', product);
    // Aquí puedes agregar lógica para favoritos
    alert(`¡${product.name} agregado a favoritos!`);
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'stock-low';
    if (stock < 5) return 'stock-medium';
    return 'stock-high';
  }

  handleImageError(event: any, product: Product): void {
    const fallbackImage = this.getFallbackImageUrl();
    if (event.target.src !== fallbackImage) {
      event.target.src = fallbackImage;
    }
  }

  private getFallbackImageUrl(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZWRlZGVkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBObyBEaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4=';
  }

  getCategoryDisplayName(category: string): string {
    const categoryNames: {[key: string]: string} = {
      'electrodomesticos': 'Electrodomésticos',
      'cuchillos': 'Cuchillos',
      'utensilios': 'Utensilios',
      'almacenamiento': 'Almacenamiento',
      'all': 'Todas'
    };
    return categoryNames[category] || category;
  }
}