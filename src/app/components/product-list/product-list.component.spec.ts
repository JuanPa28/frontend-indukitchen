import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProductListComponent } from './product-list.component';
import { ProductoService } from '../../services/product/product.service';
import { ProductoDto } from '../../services/product/product.dto';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let productoServiceMock: any;

  const mockProducts: ProductoDto[] = [
    { id: 1, nombre: 'Producto A', descripcion: 'Desc A', precio: 100 },
    { id: 2, nombre: 'Producto B', descripcion: 'Desc B', precio: 200 },
  ] as any;

  beforeEach(async () => {
    productoServiceMock = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of(mockProducts)),
    };

    await TestBed.configureTestingModule({
      imports: [ProductListComponent, HttpClientTestingModule],
      providers: [{ provide: ProductoService, useValue: productoServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  it('debería cargar productos al inicializar', () => {
    fixture.detectChanges();
    expect(component.products.length).toBe(2);
    expect(component.isLoading).toBeFalse();
  });

  it('debería manejar error al cargar productos y llamar console.error', () => {
    spyOn(console, 'error');
    productoServiceMock.getAll.and.returnValue(throwError(() => new Error('fail')));
    component.loadProducts();
    expect(component.errorMessage).toContain('Error cargando productos');
    expect(component.isLoading).toBeFalse();
    expect(console.error).toHaveBeenCalled();
  });

  it('debería loguear message cuando el error tiene propiedad message', () => {
    spyOn(console, 'error');
    productoServiceMock.getAll.and.returnValue(throwError(() => ({ message: 'server failure' })));
    component.loadProducts();
    expect(component.errorMessage).toContain('Error cargando productos');
    expect(component.isLoading).toBeFalse();
    expect(console.error).toHaveBeenCalledWith('Error loading products:', 'server failure');
  });

  it('debería loguear el error crudo cuando no existe property message', () => {
    spyOn(console, 'error');
    productoServiceMock.getAll.and.returnValue(throwError(() => 'plain error'));
    component.loadProducts();
    expect(component.errorMessage).toContain('Error cargando productos');
    expect(component.isLoading).toBeFalse();
    expect(console.error).toHaveBeenCalledWith('Error loading products:', 'plain error');
  });

  it('debería filtrar por búsqueda', () => {
    fixture.detectChanges();
    component.searchTerm = 'Producto A';
    component.applyFilters();
    expect(component.filteredProducts.length).toBe(1);
  });

  it('debería calcular paginación', () => {
    fixture.detectChanges();
    expect(component.totalPages).toBeGreaterThan(0);
  });

  it('debería cambiar página válida', () => {
    fixture.detectChanges();
    component.changePage(1);
    expect(component.currentPage).toBe(1);
  });

  it('debería devolver páginas visibles', () => {
    fixture.detectChanges();
    const pages = component.getPages();
    expect(pages.length).toBeGreaterThan(0);
  });

  it('debería truncar texto largo', () => {
    const text = 'abcde';
    expect(component.truncateText(text, 3)).toBe('abc...');
  });

  it('debería devolver vacío al truncar texto vacío', () => {
    expect(component.truncateText('', 5)).toBe('');
  });

  it('debería manejar error de imagen', () => {
    const event = { target: { src: '' } };
    component.handleImageError(event);
    expect(event.target.src).toContain('data:image/svg+xml');
  });

  it('debería disparar addToCart', () => {
    spyOn(window, 'alert');
    component.addToCart(mockProducts[0]);
    expect(window.alert).toHaveBeenCalled();
  });

  it('debería disparar viewDetails', () => {
    spyOn(window, 'alert');
    component.viewDetails(mockProducts[0]);
    expect(window.alert).toHaveBeenCalled();
  });

  it('debería extraer categorías como arreglo vacío cuando no hay categoría', () => {
    component.products = mockProducts as any;
    component.extractCategories();
    expect(component.categories).toEqual([]);
  });

  it('getCategoryDisplayName debe devolver la categoría tal cual', () => {
    expect(component.getCategoryDisplayName('cat')).toBe('cat');
  });
});
