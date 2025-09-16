import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductListComponent } from './product-list.component';
import { ProductoService } from '../../services/product/product.service';
import { of, throwError } from 'rxjs';
import { ProductoDto } from '../../services/product/product.dto';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productoServiceSpy: jasmine.SpyObj<ProductoService>;

  const mockProducts: ProductoDto[] = [
    { id: 1, nombre: 'Arroz', descripcion: 'Grano largo', precio: 1000, existencia: 5, imagen: '', peso: 1 },
    { id: 2, nombre: 'Frijol', descripcion: 'Rojo', precio: 2000, existencia: 0, imagen: '', peso: 0.5 }
  ];

  beforeEach(async () => {
    productoServiceSpy = jasmine.createSpyObj('ProductoService', ['getAll']);
    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        { provide: ProductoService, useValue: productoServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should call loadProducts', () => {
    spyOn(component, 'loadProducts');
    component.ngOnInit();
    expect(component.loadProducts).toHaveBeenCalled();
  });

  it('loadProducts should set products on success', () => {
    productoServiceSpy.getAll.and.returnValue(of(mockProducts));
    component.loadProducts();
    expect(component.products).toEqual(mockProducts);
    expect(component.filteredProducts).toEqual(mockProducts);
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('');
  });

  it('loadProducts should set errorMessage on error', () => {
    productoServiceSpy.getAll.and.returnValue(throwError(() => new Error('fail')));
    component.loadProducts();
    expect(component.errorMessage).toBe('Error cargando productos del backend');
    expect(component.isLoading).toBeFalse();
  });

  it('extractCategories should set categories to empty array', () => {
    component.extractCategories()
    expect(component.categories).toEqual([]);
  });

  it('applyFilters should filter by searchTerm', () => {
    component.products = mockProducts;
    component.searchTerm = 'arroz';
    component.applyFilters();
    expect(component.filteredProducts.length).toBe(1);
    expect(component.filteredProducts[0].nombre).toBe('Arroz');
    expect(component.currentPage).toBe(1);
  });

  it('calculatePagination should set totalPages', () => {
    component.filteredProducts = Array(16).fill(mockProducts[0]);
    component.itemsPerPage = 8;
    component.calculatePagination();
    expect(component.totalPages).toBe(2);
  });

  it('paginatedProducts should return correct slice', () => {
    component.filteredProducts = Array(10).fill(mockProducts[0]);
    component.itemsPerPage = 8;
    component.currentPage = 2;
    expect(component.paginatedProducts.length).toBe(2);
  });

  it('changePage should update currentPage', () => {
    component.totalPages = 3;
    component.currentPage = 1;
    component.changePage(2);
    expect(component.currentPage).toBe(2);
    component.changePage(0);
    expect(component.currentPage).toBe(2); // no cambia si fuera inválido
  });

  it('getPages should return correct page numbers', () => {
    component.totalPages = 10;
    component.currentPage = 5;
    const pages = component.getPages();
    expect(pages.length).toBeLessThanOrEqual(5);
    expect(pages).toContain(5);
  });

  it('addToCart should alert and log', () => {
    spyOn(window, 'alert');
    spyOn(console, 'log');
    component.addToCart(mockProducts[0]);
    expect(window.alert).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalled();
  });

  it('viewDetails should alert and log', () => {
    spyOn(window, 'alert');
    spyOn(console, 'log');
    component.viewDetails(mockProducts[0]);
    expect(window.alert).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalled();
  });

  it('handleImageError should set placeholder src', () => {
    const event = { target: { src: '' } };
    component.handleImageError(event);
    expect(event.target.src).toContain('data:image/svg+xml;base64');
  });

  it('getCategoryDisplayName should return category', () => {
    expect(component.getCategoryDisplayName('cat')).toBe('cat');
  });

  it('truncateText should truncate long text', () => {
    const text = '1234567890';
    expect(component.truncateText(text, 5)).toBe('12345...');
    expect(component.truncateText(text, 20)).toBe(text);
    expect(component.truncateText('', 5)).toBe('');
  });
});