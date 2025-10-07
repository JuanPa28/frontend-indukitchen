import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { CarritoComponent } from './cart.component';
import { CarritoService } from '../../services/cart/cart.service';
import { LocalCartService, LocalCartItem } from '../../services/cart/local-cart.service';
import { ClienteService } from '../../services/client/client.service';
import { FacturaService } from '../../services/factura/factura.service';
import { Auth } from '@angular/fire/auth';

describe('CarritoComponent', () => {
  let fixture: ComponentFixture<CarritoComponent>;
  let component: CarritoComponent;

  let carritoService: jasmine.SpyObj<CarritoService>;
  let localCartService: jasmine.SpyObj<LocalCartService> & {
    cartItems$: BehaviorSubject<LocalCartItem[]>;
    total$: BehaviorSubject<number>;
  };
  let clienteService: jasmine.SpyObj<ClienteService>;
  let facturaService: jasmine.SpyObj<FacturaService>;
  let authMock: any;

  const makeItem = (overrides: Partial<LocalCartItem> = {}): LocalCartItem => ({
    idProducto: 1,
    cantidad: 2,
    producto: { id: 1, nombre: 'Sartén', precio: 100 } as any,
    ...overrides,
  });

  beforeEach(async () => {
    carritoService = jasmine.createSpyObj<CarritoService>('CarritoService', [
      'process',
      'createWithClient',
    ]);

    localCartService = jasmine.createSpyObj<LocalCartService>('LocalCartService', [
      'clearCart',
      'updateQuantity',
      'removeProduct',
      'toBackendFormat',
    ]) as any;
    localCartService.cartItems$ = new BehaviorSubject<LocalCartItem[]>([]);
    localCartService.total$ = new BehaviorSubject<number>(0);

    clienteService = jasmine.createSpyObj<ClienteService>('ClienteService', ['getAll']);
    facturaService = jasmine.createSpyObj<FacturaService>('FacturaService', [
      'createFromCarrito',
      'sendByEmail',
    ]);

    authMock = { currentUser: undefined };

    await TestBed.configureTestingModule({
      imports: [CarritoComponent],
      providers: [
        { provide: CarritoService, useValue: carritoService },
        { provide: LocalCartService, useValue: localCartService },
        { provide: ClienteService, useValue: clienteService },
        { provide: FacturaService, useValue: facturaService },
        { provide: Auth, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CarritoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse y suscribirse a streams de carrito (items/total)', () => {
    // Arrange
    const items = [
      makeItem(),
      makeItem({ idProducto: 2, producto: { id: 2, nombre: 'Olla', precio: 50 } as any }),
    ];

    // Act
    localCartService.cartItems$.next(items);
    localCartService.total$.next(250);

    // Assert
    expect(component.items).toEqual(items);
    expect(component.total).toBe(250);
  });

  it('ngOnDestroy debería desuscribirse (no actualizar tras destroy)', () => {
    // Arrange
    const initial = component.items;

    // Act
    component.ngOnDestroy();
    localCartService.cartItems$.next([makeItem({ idProducto: 99 })]);
    localCartService.total$.next(999);

    // Assert
    expect(component.items).toBe(initial);
    expect(component.total).not.toBe(999);
  });

  it('prefillClienteFromAuth no debe llamar servicio si no hay email', () => {
    // Arrange
    (component as any).auth = { currentUser: {} };
    clienteService.getAll.and.returnValue(of([]));

    // Act
    (component as any).prefillClienteFromAuth();

    // Assert
    expect(clienteService.getAll).not.toHaveBeenCalled();
  });

  it('prefillClienteFromAuth debería precargar cliente cuando hay match', () => {
    // Arrange
    const email = 'user@mail.com';
    (component as any).auth = { currentUser: { email } };
    clienteService.getAll.and.returnValue(
      of([
        { cedula: '1', nombre: 'Ana', direccion: 'Dir', correo: email, telefono: '3000000000' },
      ] as any)
    );

    // Act
    (component as any).prefillClienteFromAuth();

    // Assert
    const v = component.clientForm.value;
    expect(v.cedula).toBe('1');
    expect(v.nombre).toBe('Ana');
    expect(v.correo).toBe(email);
  });

  it('prefillClienteFromAuth debería no alterar formulario cuando no hay match o hay error', () => {
    // Arrange
    const email = 'x@y.com';
    (component as any).auth = { currentUser: { email } };
    const snapshot = { ...component.clientForm.value };

    // Act: lista vacía
    clienteService.getAll.and.returnValue(of([]));
    (component as any).prefillClienteFromAuth();

    // Assert
    expect(component.clientForm.value).toEqual(snapshot);

    // Act: error
    clienteService.getAll.and.returnValue(throwError(() => new Error('fail')));
    (component as any).prefillClienteFromAuth();

    // Assert
    expect(component.clientForm.value).toEqual(snapshot);
  });

  it('trackByProductId debería retornar idProducto o index', () => {
    expect(component.trackByProductId(0, makeItem({ idProducto: 5 }))).toBe(5);
    expect(component.trackByProductId(7, makeItem({ idProducto: undefined as any }))).toBe(7);
  });

  it('clearCart/updateQuantity/removeProduct deberían delegar en LocalCartService', () => {
    // Arrange
    // Act
    component.clearCart();
    component.updateQuantity(1, 3);
    component.removeProduct(2);

    // Assert
    expect(localCartService.clearCart).toHaveBeenCalled();
    expect(localCartService.updateQuantity).toHaveBeenCalledWith(1, 3);
    expect(localCartService.removeProduct).toHaveBeenCalledWith(2);
  });

  it('handleImageError debería colocar placeholder', () => {
    // Arrange
    const evt = { target: { src: '' } } as any;

    // Act
    component.handleImageError(evt);

    // Assert
    expect(evt.target.src).toContain('data:image/svg+xml');
  });

  it('onSubmit inválido con carrito vacío debería mostrar error de carrito vacío', fakeAsync(() => {
    // Arrange
    const beforeCount = document.body.childElementCount;

    // Act
    component.onSubmit();
    const mid = document.body.childElementCount;

    // Assert
    expect(mid).toBeGreaterThan(beforeCount);
    tick(4000);
    expect(document.body.childElementCount).toBeLessThanOrEqual(mid);
  }));

  it('onSubmit inválido con items debería marcar touched y mostrar error de campos', fakeAsync(() => {
    // Arrange
    localCartService.cartItems$.next([makeItem()]);
    const control = component.clientForm.get('cedula')!;
    expect(control.touched).toBeFalse();

    // Act
    component.onSubmit();
    tick(4000);

    // Assert
    expect(control.touched).toBeTrue();
  }));

  it('buildProcesarCarritoRequest debería usar valores del formulario (sin loggedCliente) y defaults', () => {
    // Arrange
    component.items = [makeItem({ idProducto: 1 }), makeItem({ idProducto: 0 as any })];
    component.clientForm.patchValue({
      cedula: '  12345678 ',
      nombre: '  Juan  ',
      direccion: '  Calle 123456  ',
      correo: '  j@x.com ',
      telefono: ' 3000000000 ',
      metodoPago: '',
      enviarOtroEmail: false,
    });

    // Act
    const req = (component as any).buildProcesarCarritoRequest();

    // Assert
    expect(req.cliente.cedula).toBe('12345678');
    expect(req.productoIds).toEqual([1]); // filtra falsy
    expect(req.idMetodoPago).toBe(1);
    expect('emailTo' in req).toBeFalse();
  });

  it('buildProcesarCarritoRequest debería priorizar loggedCliente e incluir campos de email', () => {
    // Arrange
    (component as any).loggedCliente = {
      cedula: '9',
      nombre: 'L',
      direccion: 'D',
      correo: 'l@x',
      telefono: '300',
    } as any;
    component.items = [makeItem({ idProducto: 7 })];
    component.clientForm.patchValue({
      metodoPago: ' 2 ',
      enviarOtroEmail: true,
      emailTo: '  a@b.com ',
      emailSubject: '  Hola ',
      emailText: '  Texto  ',
    });

    // Act
    const req = (component as any).buildProcesarCarritoRequest();

    // Assert
    expect(req.cliente.cedula).toBe('9');
    expect(req.productoIds).toEqual([7]);
    expect(req.idMetodoPago).toBe(2);
    expect(req.emailTo).toBe('a@b.com');
    expect(req.emailSubject).toBe('Hola');
    expect(req.emailText).toBe('Texto');
  });

  it('onSubmit válido debería procesar carrito (éxito directo), limpiar y mostrar success (sin factura)', fakeAsync(() => {
    // Arrange
    localCartService.cartItems$.next([makeItem()]);
    component.clientForm.patchValue({
      cedula: '12345678',
      nombre: 'Juan',
      direccion: 'Dirección válida',
      correo: 'j@x.com',
      telefono: '3000000000',
    });
    carritoService.process.and.returnValue(of({ id: 'C1' } as any));

    // Act
    const beforeCount = document.body.childElementCount;
    component.onSubmit();
    const mid = document.body.childElementCount;

    // Assert inmediato (antes de remover)
    expect(carritoService.process).toHaveBeenCalled();
    expect(localCartService.clearCart).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
    expect(mid).toBeGreaterThan(beforeCount);

    tick(3000);
    expect(document.body.childElementCount).toBeLessThanOrEqual(mid);
  }));

  it('onSubmit debería usar fallback: carrito con id -> crear factura -> enviar email (éxito)', fakeAsync(() => {
    // Arrange
    localCartService.cartItems$.next([makeItem()]);
    localCartService.toBackendFormat.and.returnValue([{ idProducto: 1, cantidad: 2 }]);
    component.clientForm.patchValue({
      cedula: '12345678',
      nombre: 'Juan',
      direccion: 'Dirección válida',
      correo: 'j@x.com',
      telefono: '3000000000',
    });
    carritoService.process.and.returnValue(throwError(() => new Error('proc fail')));
    carritoService.createWithClient.and.returnValue(of({ id: 'C9' } as any));
    facturaService.createFromCarrito.and.returnValue(of({ id: 'F9' } as any));
    facturaService.sendByEmail.and.returnValue(of({}));

    // Act
    const beforeCount = document.body.childElementCount;
    component.onSubmit();
    const mid = document.body.childElementCount;

    // Assert
    expect(localCartService.toBackendFormat).toHaveBeenCalled();
    expect(carritoService.createWithClient).toHaveBeenCalledWith('12345678', [
      { idProducto: 1, cantidad: 2 },
    ]);
    expect(facturaService.createFromCarrito).toHaveBeenCalledWith('C9');
    expect(facturaService.sendByEmail).toHaveBeenCalledWith('F9');
    expect(localCartService.clearCart).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
    expect(mid).toBeGreaterThan(beforeCount);

    tick(3000);
    expect(document.body.childElementCount).toBeLessThanOrEqual(mid);
  }));

  it('fallback: carrito sin id debería no crear factura ni enviar email', () => {
    // Arrange
    localCartService.cartItems$.next([makeItem()]);
    localCartService.toBackendFormat.and.returnValue([{ idProducto: 1, cantidad: 1 }]);
    component.clientForm.patchValue({
      cedula: '12345678',
      nombre: 'Juan',
      direccion: 'Dirección válida',
      correo: 'j@x.com',
      telefono: '3000000000',
    });

    carritoService.process.and.returnValue(throwError(() => new Error('proc fail')));
    carritoService.createWithClient.and.returnValue(of({ id: null } as any));

    // Act
    component.onSubmit();

    // Assert
    expect(facturaService.createFromCarrito).not.toHaveBeenCalled();
    expect(facturaService.sendByEmail).not.toHaveBeenCalled();
  });

  it('fallback: factura sin id debería no enviar email', () => {
    // Arrange
    localCartService.cartItems$.next([makeItem()]);
    localCartService.toBackendFormat.and.returnValue([{ idProducto: 1, cantidad: 1 }]);
    component.clientForm.patchValue({
      cedula: '12345678',
      nombre: 'Juan',
      direccion: 'Dirección válida',
      correo: 'j@x.com',
      telefono: '3000000000',
    });

    carritoService.process.and.returnValue(throwError(() => new Error('proc fail')));
    carritoService.createWithClient.and.returnValue(of({ id: 'C1' } as any));
    facturaService.createFromCarrito.and.returnValue(of({ id: undefined } as any));

    // Act
    component.onSubmit();

    // Assert
    expect(facturaService.createFromCarrito).toHaveBeenCalledWith('C1');
    expect(facturaService.sendByEmail).not.toHaveBeenCalled();
  });

  it('fallback: error al enviar email debería ser capturado y continuar', () => {
    // Arrange
    localCartService.cartItems$.next([makeItem()]);
    localCartService.toBackendFormat.and.returnValue([{ idProducto: 1, cantidad: 1 }]);
    component.clientForm.patchValue({
      cedula: '12345678',
      nombre: 'Juan',
      direccion: 'Dirección válida',
      correo: 'j@x.com',
      telefono: '3000000000',
    });

    carritoService.process.and.returnValue(throwError(() => new Error('proc fail')));
    carritoService.createWithClient.and.returnValue(of({ id: 'C2' } as any));
    facturaService.createFromCarrito.and.returnValue(of({ id: 'F2' } as any));
    facturaService.sendByEmail.and.returnValue(throwError(() => new Error('mail fail')));

    // Act
    component.onSubmit();

    // Assert
    expect(facturaService.createFromCarrito).toHaveBeenCalledWith('C2');
    expect(facturaService.sendByEmail).toHaveBeenCalledWith('F2');
  });

  it('onSubmit debería manejar error final cuando fallback falla (subscribe.error -> showErrorMessage)', fakeAsync(() => {
    // Arrange
    localCartService.cartItems$.next([makeItem()]);
    localCartService.toBackendFormat.and.returnValue([{ idProducto: 1, cantidad: 1 }]);
    component.clientForm.patchValue({
      cedula: '12345678',
      nombre: 'Juan',
      direccion: 'Dirección válida',
      correo: 'j@x.com',
      telefono: '3000000000',
    });

    carritoService.process.and.returnValue(throwError(() => new Error('proc fail')));
    carritoService.createWithClient.and.returnValue(throwError(() => new Error('fallback fail')));

    const before = document.body.childElementCount;

    // Act
    component.onSubmit();
    const mid = document.body.childElementCount;

    // Assert
    expect(component.isLoading).toBeFalse();
    expect(mid).toBeGreaterThan(before);

    tick(4000);
    expect(document.body.childElementCount).toBeLessThanOrEqual(mid);
  }));

  it('showErrorMessage debería crear y remover overlay tras timeout', fakeAsync(() => {
    // Arrange
    const before = document.body.childElementCount;

    // Act
    (component as any).showErrorMessage('Error demo');
    const mid = document.body.childElementCount;
    tick(4000);

    // Assert
    expect(mid).toBeGreaterThan(before);
    expect(document.body.childElementCount).toBeLessThanOrEqual(mid);
  }));

  it('showSuccessMessage debería crear backdrop y modal y removerlos', fakeAsync(() => {
    // Arrange
    const before = document.body.childElementCount;

    // Act
    (component as any).showSuccessMessage({ id: 'F1' });
    const mid = document.body.childElementCount;
    tick(3000);

    // Assert
    expect(mid).toBeGreaterThan(before);
    expect(document.body.childElementCount).toBeLessThanOrEqual(mid);
  }));

  it('handleExistingClient debería crear carrito (éxito): mostrar success, limpiar carrito, resetear form e isLoading=false', () => {
    // Arrange
    const detalles = [{ idProducto: 1, cantidad: 2 }];
    carritoService.createWithClient.and.returnValue(of({ id: 'NC1' } as any));
    const successSpy = spyOn(component as any, 'showSuccessMessage').and.stub();
    const resetSpy = spyOn(component.clientForm, 'reset').and.callThrough();
    component.isLoading = true;

    // Act
    (component as any).handleExistingClient('12345678', detalles);

    // Assert
    expect(carritoService.createWithClient).toHaveBeenCalledWith('12345678', detalles);
    expect(successSpy).toHaveBeenCalled();
    expect(localCartService.clearCart).toHaveBeenCalled();
    expect(resetSpy).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
  });

  it('handleExistingClient debería manejar error: mostrar error e isLoading=false (sin limpiar carrito ni resetear form)', () => {
    // Arrange
    const detalles = [{ idProducto: 1, cantidad: 2 }];
    carritoService.createWithClient.and.returnValue(throwError(() => new Error('x')));
    const errorSpy = spyOn(component as any, 'showErrorMessage').and.stub();
    const resetSpy = spyOn(component.clientForm, 'reset').and.callThrough();
    component.isLoading = true;

    // Act
    (component as any).handleExistingClient('12345678', detalles);

    // Assert
    expect(carritoService.createWithClient).toHaveBeenCalledWith('12345678', detalles);
    expect(errorSpy).toHaveBeenCalledWith(
      'Error al crear el carrito. Por favor, intenta nuevamente.'
    );
    expect(component.isLoading).toBeFalse();
    expect(localCartService.clearCart).not.toHaveBeenCalled();
    expect(resetSpy).not.toHaveBeenCalled();
  });
});
