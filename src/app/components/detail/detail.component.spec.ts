import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DetailComponent } from './detail.component';
import { CarritoService } from '../../services/cart/cart.service';
import { DetailDto } from '../../services/detail/detail.dto';

describe('DetailComponent', () => {
  let component: DetailComponent;
  let fixture: ComponentFixture<DetailComponent>;
  let carritoServiceSpy: jasmine.SpyObj<CarritoService>;

  const makeDetalle = (overrides?: Partial<DetailDto>): DetailDto => ({
    idProducto: 1,
    cantidad: 2,
    producto: {
      id: 1,
      nombre: 'Sartén',
      descripcion: '',
      precio: 100,
      existencia: 10,
      peso: 1,
      imagen: '',
    } as any,
    ...overrides,
  });

  beforeEach(async () => {
    carritoServiceSpy = jasmine.createSpyObj<CarritoService>('CarritoService', [
      'updateDetalle',
      'removeDetalle',
    ]);
    carritoServiceSpy.updateDetalle.and.returnValue(of({} as any));
    carritoServiceSpy.removeDetalle.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [DetailComponent],
      providers: [{ provide: CarritoService, useValue: carritoServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailComponent);
    component = fixture.componentInstance;
    component.detalle = makeDetalle(); // Arrange base
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component['carritoId']).toBe('1');
  });

  it('increase debería incrementar cantidad y llamar updateDetalle (AAA)', () => {
    // Arrange
    const prev = component.detalle.cantidad;

    // Act
    component.increase();

    // Assert
    expect(component.detalle.cantidad).toBe(prev + 1);
    expect(carritoServiceSpy.updateDetalle).toHaveBeenCalledWith('1', component.detalle);
  });

  it('decrease debería decrementar (>1) y llamar updateDetalle', () => {
    // Arrange
    component.detalle = makeDetalle({ cantidad: 3 });

    // Act
    component.decrease();

    // Assert
    expect(component.detalle.cantidad).toBe(2);
    expect(carritoServiceSpy.updateDetalle).toHaveBeenCalledWith('1', component.detalle);
    expect(carritoServiceSpy.removeDetalle).not.toHaveBeenCalled();
  });

  it('decrease con cantidad = 1 e idProducto definido debería delegar en remove()', () => {
    // Arrange
    carritoServiceSpy.updateDetalle.calls.reset();
    carritoServiceSpy.removeDetalle.calls.reset();
    component.detalle = makeDetalle({ cantidad: 1, idProducto: 7 });

    // Act
    component.decrease();

    // Assert
    expect(carritoServiceSpy.updateDetalle).not.toHaveBeenCalled();
    expect(carritoServiceSpy.removeDetalle).toHaveBeenCalledWith('1', 7);
  });

  it('decrease con cantidad = 1 e idProducto undefined no debe llamar servicios', () => {
    // Arrange
    carritoServiceSpy.updateDetalle.calls.reset();
    carritoServiceSpy.removeDetalle.calls.reset();
    component.detalle = makeDetalle({ cantidad: 1, idProducto: undefined as any });

    // Act
    component.decrease();

    // Assert
    expect(carritoServiceSpy.updateDetalle).not.toHaveBeenCalled();
    expect(carritoServiceSpy.removeDetalle).not.toHaveBeenCalled();
  });

  it('remove debería llamar removeDetalle cuando hay idProducto', () => {
    // Arrange
    component.detalle = makeDetalle({ idProducto: 15 });

    // Act
    component.remove();

    // Assert
    expect(carritoServiceSpy.removeDetalle).toHaveBeenCalledWith('1', 15);
  });

  it('remove no debería llamar al servicio cuando idProducto no existe', () => {
    // Arrange
    carritoServiceSpy.removeDetalle.calls.reset();
    component.detalle = makeDetalle({ idProducto: undefined as any });

    // Act
    component.remove();

    // Assert
    expect(carritoServiceSpy.removeDetalle).not.toHaveBeenCalled();
  });

  it('handleImageError debería poner placeholder en src', () => {
    // Arrange
    const img: any = { src: '' };
    const evt = { target: img } as unknown as Event;

    // Act
    component.handleImageError(evt);

    // Assert
    expect(img.src).toBe('https://via.placeholder.com/80x80?text=Sin+Img');
  });
});
