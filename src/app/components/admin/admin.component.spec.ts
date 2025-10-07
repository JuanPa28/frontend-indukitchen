import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { AdminComponent } from './admin.component';
import { ClienteService } from '../../services/client/client.service';
import { ProductoService } from '../../services/product/product.service';
import { FacturaService } from '../../services/factura/factura.service';
import { CarritoService } from '../../services/cart/cart.service';
import { ClienteDto } from '../../services/client/client.dto';
import { ProductoDto } from '../../services/product/product.dto';
import { FacturaDto } from '../../services/factura/factura.dto';
import { CartDto } from '../../services/cart/cart.dto';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  let clienteServiceMock: jasmine.SpyObj<ClienteService>;
  let productoServiceMock: jasmine.SpyObj<ProductoService>;
  let facturaServiceMock: jasmine.SpyObj<FacturaService>;
  let carritoServiceMock: jasmine.SpyObj<CarritoService>;

  const sampleClient: ClienteDto = {
    cedula: '1234567890',
    nombre: 'Juan Pérez',
    direccion: 'Calle Falsa 123',
    correo: 'juan@example.com',
    telefono: '3001234567',
  };

  const sampleProduct: ProductoDto = {
    id: 1,
    nombre: 'Producto A',
    descripcion: 'Desc A',
    precio: 100,
    existencia: 10,
    peso: 1,
    imagen: 'http://image',
  } as any;

  const sampleFacturaWithTotal: FacturaDto = {
    id: 'F1',
    idCarrito: 'C1',
    total: 150,
  };

  const sampleFacturaNoTotal: FacturaDto = {
    id: 'F2',
    idCarrito: 'C2',
  };

  beforeEach(async () => {
    clienteServiceMock = jasmine.createSpyObj<ClienteService>('ClienteService', [
      'getAll',
      'getByCedula',
      'create',
      'update',
      'delete',
    ]);

    productoServiceMock = jasmine.createSpyObj<ProductoService>('ProductoService', [
      'getAll',
      'create',
      'update',
      'delete',
    ]);

    facturaServiceMock = jasmine.createSpyObj<FacturaService>('FacturaService', [
      'getAll',
      'sendByEmail',
      'delete',
      'openPdfInNewTab',
    ]);

    carritoServiceMock = jasmine.createSpyObj<CarritoService>('CarritoService', [
      'getAll',
      'getById',
      'delete',
    ]);

    clienteServiceMock.getAll.and.returnValue(of([]));
    productoServiceMock.getAll.and.returnValue(of([]));
    facturaServiceMock.getAll.and.returnValue(of([]));
    carritoServiceMock.getById.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: ClienteService, useValue: clienteServiceMock },
        { provide: ProductoService, useValue: productoServiceMock },
        { provide: FacturaService, useValue: facturaServiceMock },
        { provide: CarritoService, useValue: carritoServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if ((window.confirm as any).and?.isSpy) (window.confirm as any).and.stub();
    if ((window.alert as any).and?.isSpy) (window.alert as any).and.stub();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  it('loadClients debería cargar clientes (éxito)', () => {
    clienteServiceMock.getAll.and.returnValue(of([sampleClient]));
    component.loadClients();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('');
    expect(component.clients.length).toBe(1);
    expect(component.filteredClients.length).toBe(1);
  });

  it('loadClients debería manejar error', () => {
    clienteServiceMock.getAll.and.returnValue(throwError(() => new Error('fail')));
    component.loadClients();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toContain('No se pudieron cargar los clientes');
  });

  it('loadClients debería manejar respuesta nula', () => {
    clienteServiceMock.getAll.and.returnValue(of(null as any));
    component.loadClients();
    expect(component.clients).toEqual([]);
    expect(component.filteredClients).toEqual([]);
    expect(component.isLoading).toBeFalse();
  });

  it('loadProducts debería cargar productos (éxito)', () => {
    productoServiceMock.getAll.and.returnValue(of([sampleProduct]));
    component.loadProducts();
    expect(component.pIsLoading).toBeFalse();
    expect(component.filteredProducts.length).toBe(1);
  });

  it('loadProducts debería manejar error', () => {
    productoServiceMock.getAll.and.returnValue(throwError(() => new Error('x')));
    component.loadProducts();
    expect(component.pIsLoading).toBeFalse();
    expect(component.pErrorMessage).toContain('No se pudieron cargar los productos');
  });

  it('loadProducts debería manejar respuesta nula', () => {
    productoServiceMock.getAll.and.returnValue(of(null as any));
    component.loadProducts();
    expect(component.products).toEqual([]);
    expect(component.filteredProducts).toEqual([]);
    expect(component.pIsLoading).toBeFalse();
  });

  it('loadFacturas debería dejar lista vacía si servicio retorna vacío', () => {
    facturaServiceMock.getAll.and.returnValue(of([]));
    component.loadFacturas();
    expect(component.fIsLoading).toBeFalse();
    expect(component.facturas.length).toBe(0);
  });

  it('loadFacturas debería enriquecer por datos del carrito (nombre/correo presentes)', () => {
    facturaServiceMock.getAll.and.returnValue(of([{ id: 'F9', idCarrito: 'C9' } as FacturaDto]));
    carritoServiceMock.getById.and.returnValue(
      of({ id: 'C9', cliente: { nombre: 'Mary', correo: 'mary@ex.com' } })
    );

    component.loadFacturas();

    expect(component.fIsLoading).toBeFalse();
    expect(component.facturas[0].clienteNombre).toBe('Mary');
    expect(component.facturas[0].clienteCorreo).toBe('mary@ex.com');
  });

  it('loadFacturas debería enriquecer con ClienteService cuando faltan datos', () => {
    facturaServiceMock.getAll.and.returnValue(of([{ id: 'F10', idCarrito: 'C10' } as FacturaDto]));
    carritoServiceMock.getById.and.returnValue(
      of({ id: 'C10', cliente: { cedula: sampleClient.cedula } })
    );
    clienteServiceMock.getByCedula.and.returnValue(of(sampleClient));

    component.loadFacturas();

    expect(component.fIsLoading).toBeFalse();
    expect(component.facturas[0].clienteNombre).toBe(sampleClient.nombre);
    expect(component.facturas[0].clienteCorreo).toBe(sampleClient.correo);
  });

  it('loadFacturas debería manejar error', () => {
    facturaServiceMock.getAll.and.returnValue(throwError(() => new Error('boom')));
    component.loadFacturas();
    expect(component.fIsLoading).toBeFalse();
    expect(component.fErrorMessage).toContain('No se pudieron cargar las facturas');
  });

  it('loadCarts debería dejar lista vacía si servicio retorna vacío', () => {
    carritoServiceMock.getAll.and.returnValue(of([]));
    component.loadCarts();
    expect(component.cIsLoading).toBeFalse();
    expect(component.carts.length).toBe(0);
  });

  it('loadCarts debería enriquecer carritos y marcar hasFactura', () => {
    const carts: CartDto[] = [{ id: 'C1' } as any, { id: 'C2' } as any];
    carritoServiceMock.getAll.and.returnValue(of(carts));
    (carritoServiceMock.getById as jasmine.Spy).and.callFake((id: string) => of({ id }));
    clienteServiceMock.getByCedula.and.callFake((ced: string) =>
      of({ ...sampleClient, cedula: ced })
    );
    facturaServiceMock.getAll.and.returnValue(of([{ id: 'F1', idCarrito: 'C2' } as FacturaDto]));

    component.loadCarts();

    expect(component.cIsLoading).toBeFalse();
    expect(component.carts.length).toBe(2);
    const c1 = component.carts.find((c: any) => String(c.id) === 'C1')!;
    const c2 = component.carts.find((c: any) => String(c.id) === 'C2')!;
    expect((c1 as any).hasFactura).toBeFalse();
    expect((c2 as any).hasFactura).toBeTrue();
  });

  it('loadCarts debería manejar error', () => {
    carritoServiceMock.getAll.and.returnValue(throwError(() => new Error('fail')));
    component.loadCarts();
    expect(component.cIsLoading).toBeFalse();
    expect(component.cErrorMessage).toContain('No se pudieron cargar los carritos');
  });

  it('loadCarts debería manejar lista nula', () => {
    carritoServiceMock.getAll.and.returnValue(of(null as any));
    component.loadCarts();
    expect(component.carts).toEqual([]);
    expect(component.cIsLoading).toBeFalse();
  });

  it('loadCarts debería usar catchError de facturas y conservar datos', () => {
    carritoServiceMock.getAll.and.returnValue(
      of([{ id: 'C1', clienteCedula: '123', detalles: [] } as any])
    );
    clienteServiceMock.getByCedula.and.returnValue(throwError(() => new Error('fail')));
    facturaServiceMock.getAll.and.returnValue(throwError(() => new Error('boom')));
    component.loadCarts();
    const cart = component.carts[0];
    expect(cart.idCliente).toBe('123');
    expect(cart.productoCount).toBe(0);
    expect(component.cIsLoading).toBeFalse();
  });

  it('applyFilter debería filtrar por cédula o nombre', () => {
    component.clients = [sampleClient, { ...sampleClient, cedula: '999', nombre: 'Otro' }];
    component.searchTerm = 'Juan';
    component.applyFilter();
    expect(component.filteredClients.length).toBe(1);
  });

  it('applyProductFilter debería filtrar por nombre o descripción', () => {
    component.products = [
      sampleProduct,
      { ...sampleProduct, id: 2, nombre: 'B', descripcion: 'ZZZ' },
    ];
    component.productSearchTerm = 'producto a';
    component.applyProductFilter();
    expect(component.filteredProducts.length).toBe(1);
  });

  it('applyFilter debería tolerar término vacío', () => {
    component.clients = [sampleClient];
    component.searchTerm = '';
    component.applyFilter();
    expect(component.filteredClients).toEqual([sampleClient]);
  });

  it('applyProductFilter debería evaluar campos opcionales', () => {
    component.products = [
      sampleProduct,
      { ...sampleProduct, id: 99, nombre: undefined as any, descripcion: undefined as any },
    ];
    component.productSearchTerm = 'producto';
    component.applyProductFilter();
    expect(component.filteredProducts.length).toBe(1);
  });

  it('openCreateForm/closeForm deberían resetear estado y datos', () => {
    component.isEditing = true;
    component.formData = { ...sampleClient };
    component.openCreateForm();
    expect(component.showForm).toBeTrue();
    expect(component.isEditing).toBeFalse();
    expect(component.formData.cedula).toBe('');

    component.closeForm();
    expect(component.showForm).toBeFalse();
    expect(component.isEditing).toBeFalse();
    expect(component.formData.cedula).toBe('');
  });

  it('openCreateProductForm/openEditProductForm/closeProductForm deberían manejar estado', () => {
    component.openCreateProductForm();
    expect(component.showProductForm).toBeTrue();
    expect(component.isEditingProduct).toBeFalse();
    expect(component.productFormData.nombre).toBe('');

    component.openEditProductForm(sampleProduct);
    expect(component.isEditingProduct).toBeTrue();
    expect(component.productFormData.nombre).toBe(sampleProduct.nombre);

    component.closeProductForm();
    expect(component.showProductForm).toBeFalse();
    expect(component.isEditingProduct).toBeFalse();
  });

  it('submitForm debería validar campos requeridos', () => {
    component.formData = { cedula: '', nombre: '', direccion: '', correo: '', telefono: '' };
    component.submitForm();
    expect(component.errorMessage).toContain('Todos los campos son obligatorios');
  });

  it('submitForm debería actualizar cliente cuando isEditing=true (éxito)', fakeAsync(() => {
    component.isEditing = true;
    component.formData = { ...sampleClient };
    const loadClientsSpy = spyOn(component, 'loadClients').and.stub();
    const closeFormSpy = spyOn(component, 'closeForm').and.stub();
    clienteServiceMock.update.and.returnValue(of(sampleClient));

    component.submitForm();

    expect(clienteServiceMock.update).toHaveBeenCalledWith(sampleClient);
    expect(loadClientsSpy).toHaveBeenCalled();
    expect(closeFormSpy).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
    expect(component.successMessage).toContain('Cliente actualizado');
    tick(2500);
  }));

  it('submitForm debería manejar errores cuando se actualiza un cliente', () => {
    component.isEditing = true;
    component.formData = {
      cedula: '1234567890',
      nombre: 'Cliente Demo',
      direccion: 'Calle 1',
      correo: 'demo@mail.com',
      telefono: '3001234567',
    };

    clienteServiceMock.update.and.returnValue(throwError(() => new Error('fail')));

    component.submitForm();

    expect(clienteServiceMock.update).toHaveBeenCalledWith(component.formData);
    expect(component.errorMessage).toBe('No se pudo actualizar el cliente.');
    expect(component.isLoading).toBeFalse();
  });

  it('submitForm debería crear cliente cuando isEditing=false (error)', () => {
    component.isEditing = false;
    component.formData = { ...sampleClient };
    clienteServiceMock.create.and.returnValue(throwError(() => new Error('boom')));

    component.submitForm();
    expect(clienteServiceMock.create).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toContain('No se pudo crear el cliente');
  });

  it('submitForm debería crear cliente cuando isEditing=false (éxito)', fakeAsync(() => {
    component.isEditing = false;
    component.formData = { ...sampleClient };
    const loadClientsSpy = spyOn(component, 'loadClients').and.stub();
    const closeFormSpy = spyOn(component, 'closeForm').and.stub();
    clienteServiceMock.create.and.returnValue(of(sampleClient));

    component.submitForm();

    expect(clienteServiceMock.create).toHaveBeenCalledWith(sampleClient);
    expect(loadClientsSpy).toHaveBeenCalled();
    expect(closeFormSpy).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
    expect(component.successMessage).toContain('Cliente creado');
    tick(2500);
  }));

  it('submitProductForm debería validar requeridos', () => {
    component.productFormData = {
      nombre: '',
      descripcion: '',
      precio: undefined,
      existencia: undefined,
      peso: undefined,
    };
    component.submitProductForm();
    expect(component.pErrorMessage).toContain('Todos los campos marcados con *');
  });

  it('submitProductForm debería validar positivos', () => {
    component.productFormData = {
      nombre: 'X',
      descripcion: 'Y',
      precio: -1,
      existencia: 1,
      peso: 1,
    };
    component.submitProductForm();
    expect(component.pErrorMessage).toContain('valores positivos');
  });

  it('submitProductForm debería crear producto (éxito)', () => {
    component.isEditingProduct = false;
    component.productFormData = {
      nombre: 'X',
      descripcion: 'Y',
      precio: 1,
      existencia: 2,
      peso: 3,
      imagen: '',
    };
    productoServiceMock.create.and.returnValue(of(sampleProduct));
    const afterProductMutationSpy = spyOn(
      component as any,
      'afterProductMutation'
    ).and.callThrough();

    component.submitProductForm();
    expect(productoServiceMock.create).toHaveBeenCalled();
    expect(afterProductMutationSpy).toHaveBeenCalled();
    expect((component as any).pSuccessMessage).toContain('Producto creado');
  });

  it('submitProductForm debería actualizar producto (éxito)', () => {
    component.isEditingProduct = true;
    component.productFormData = {
      id: 99,
      nombre: 'Nuevo',
      descripcion: 'Desc',
      precio: 50,
      existencia: 5,
      peso: 2,
      imagen: '',
    };
    productoServiceMock.update.and.returnValue(of(sampleProduct));
    const afterProductMutationSpy = spyOn(
      component as any,
      'afterProductMutation'
    ).and.callThrough();

    component.submitProductForm();

    expect(productoServiceMock.update).toHaveBeenCalled();
    expect(afterProductMutationSpy).toHaveBeenCalled();
    expect(component.pIsLoading).toBeFalse();
    expect(component.pSuccessMessage).toContain('Producto actualizado');
  });

  it('submitProductForm debería actualizar producto (error)', () => {
    component.isEditingProduct = true;
    component.productFormData = {
      id: 1,
      nombre: 'X',
      descripcion: 'Y',
      precio: 1,
      existencia: 2,
      peso: 3,
    };
    productoServiceMock.update.and.returnValue(throwError(() => new Error('x')));

    component.submitProductForm();
    expect(productoServiceMock.update).toHaveBeenCalled();
    expect(component.pIsLoading).toBeFalse();
    expect(component.pErrorMessage).toContain('No se pudo actualizar el producto');
  });

  it('confirmDelete debería cancelar si usuario no confirma', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.confirmDelete(sampleClient);
    expect(clienteServiceMock.delete).not.toHaveBeenCalled();
  });

  it('confirmDelete debería eliminar y mostrar éxito', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    clienteServiceMock.delete.and.returnValue(of(void 0));
    const afterMutationSpy = spyOn(component as any, 'afterMutation').and.callThrough();

    component.confirmDelete(sampleClient);
    expect(clienteServiceMock.delete).toHaveBeenCalledWith(sampleClient.cedula);
    expect(component.successMessage).toContain('Cliente eliminado');
    expect(afterMutationSpy).toHaveBeenCalled();
  });

  it('confirmDelete debería mapear errores HTTP a mensajes', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    clienteServiceMock.delete.and.returnValue(throwError(() => ({ status: 404 })));
    component.confirmDelete(sampleClient);
    expect(component.errorMessage).toContain('no existe');

    clienteServiceMock.delete.and.returnValue(throwError(() => ({ status: 500 })));
    component.confirmDelete(sampleClient);
    expect(component.errorMessage).toContain('registros asociados');

    clienteServiceMock.delete.and.returnValue(
      throwError(() => ({ status: 409, error: { detail: 'detalle' } }))
    );
    component.confirmDelete(sampleClient);
    expect(component.errorMessage).toContain('detalle');
  });

  it('confirmDeleteProduct debería eliminar producto (éxito)', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    productoServiceMock.delete.and.returnValue(of(void 0));
    component.confirmDeleteProduct(sampleProduct);
    expect(productoServiceMock.delete).toHaveBeenCalledWith(sampleProduct.id);
    expect(component.pSuccessMessage).toContain('Producto eliminado');
  });

  it('confirmDeleteProduct debería manejar error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    productoServiceMock.delete.and.returnValue(throwError(() => new Error('x')));
    component.confirmDeleteProduct(sampleProduct);
    expect(component.pErrorMessage).toContain('No se pudo eliminar el producto');
  });

  it('confirmDeleteProduct debería cancelar si no confirma', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.confirmDeleteProduct(sampleProduct);
    expect(productoServiceMock.delete).not.toHaveBeenCalled();
  });

  it('confirmDeleteCart debería no hacer nada si no hay id', () => {
    component.confirmDeleteCart({} as any);
    expect(carritoServiceMock.delete).not.toHaveBeenCalled();
  });

  it('confirmDeleteCart debería impedir si tiene factura', () => {
    component.confirmDeleteCart({ id: 'C1', hasFactura: true } as any);
    expect(component.cErrorMessage).toContain('factura asociada');
    expect(carritoServiceMock.delete).not.toHaveBeenCalled();
  });

  it('confirmDeleteCart debería eliminar carrito (éxito)', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    carritoServiceMock.delete.and.returnValue(of(void 0));
    const loadCartsSpy = spyOn(component as any, 'loadCarts').and.stub();

    component.confirmDeleteCart({ id: 'C1' } as any);
    expect(carritoServiceMock.delete).toHaveBeenCalledWith('C1');
    expect(component.cSuccessMessage).toContain('Carrito eliminado');
    expect(loadCartsSpy).toHaveBeenCalled();
  });

  it('confirmDeleteCart debería mapear errores (409/500) y otros', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    carritoServiceMock.delete.and.returnValue(throwError(() => ({ status: 409 })));
    component.confirmDeleteCart({ id: 'C1' } as any);
    expect(component.cErrorMessage).toContain('registros asociados');

    carritoServiceMock.delete.and.returnValue(throwError(() => ({ status: 500 })));
    component.confirmDeleteCart({ id: 'C2' } as any);
    expect(component.cErrorMessage).toContain('registros asociados');

    carritoServiceMock.delete.and.returnValue(throwError(() => ({ status: 400 })));
    component.confirmDeleteCart({ id: 'C3' } as any);
    expect(component.cErrorMessage).toContain('No se pudo eliminar el carrito');
  });

  it('viewFacturaPdf debería delegar a FacturaService', () => {
    component.viewFacturaPdf({ id: 'F1', idCarrito: 'C1' });
    expect(facturaServiceMock.openPdfInNewTab).toHaveBeenCalledWith('F1' as any);
  });

  it('sendFacturaEmail debería enviar (éxito) y manejar error', () => {
    facturaServiceMock.sendByEmail.and.returnValue(of({}));
    component.sendFacturaEmail({ id: 'F1', idCarrito: 'C1' });
    expect(facturaServiceMock.sendByEmail).toHaveBeenCalledWith('F1');
    expect(component.fSuccessMessage).toContain('Factura enviada');

    facturaServiceMock.sendByEmail.and.returnValue(throwError(() => new Error('x')));
    component.sendFacturaEmail({ id: 'F2', idCarrito: 'C2' });
    expect(component.fErrorMessage).toContain('No se pudo enviar la factura');
  });

  it('confirmDeleteFactura debería eliminar (éxito) y manejar error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    facturaServiceMock.delete.and.returnValue(of(void 0));
    const loadFacturasSpy = spyOn(component as any, 'loadFacturas').and.stub();

    component.confirmDeleteFactura({ id: 'F1', idCarrito: 'C1' });
    expect(facturaServiceMock.delete).toHaveBeenCalledWith('F1');
    expect(loadFacturasSpy).toHaveBeenCalled();

    facturaServiceMock.delete.and.returnValue(throwError(() => new Error('x')));
    component.confirmDeleteFactura({ id: 'F2', idCarrito: 'C2' });
    expect(component.fErrorMessage).toContain('No se pudo eliminar la factura');
  });

  it('confirmDeleteFactura debería cancelar si no confirma o no hay id', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.confirmDeleteFactura({ id: 'F1', idCarrito: 'C1' });
    expect(facturaServiceMock.delete).not.toHaveBeenCalled();

    component.confirmDeleteFactura({} as any);
    expect(facturaServiceMock.delete).not.toHaveBeenCalled();
  });

  it('onProductImageError debería reemplazar por placeholder', () => {
    const img = { onerror: () => {}, src: '' } as any as HTMLImageElement;
    const evt = { target: img };
    component.onProductImageError(evt);
    expect(img.src).toBe(component.productPlaceholder);
  });

  it('trackBy methods deberían retornar keys', () => {
    expect(component.trackByCedula(0, sampleClient)).toBe(sampleClient.cedula);
    expect(component.trackByProductId(0, sampleProduct)).toBe(sampleProduct.id);
    expect(component.trackByFacturaId(0, sampleFacturaWithTotal)).toBe(sampleFacturaWithTotal.id);
    expect(component.trackByCartId(0, { id: 'C1' } as any)).toBe('C1' as any);
  });

  it('toggleNav debería alternar estado', () => {
    const initial = component.navCollapsed;
    component.toggleNav();
    expect(component.navCollapsed).toBe(!initial);
  });

  it('setSection debería invocar cargas según sección y estado', () => {
    const loadClientsSpy = spyOn(component, 'loadClients').and.stub();
    const loadProductsSpy = spyOn(component, 'loadProducts').and.stub();
    const loadFacturasSpy = spyOn(component, 'loadFacturas').and.stub();
    const loadCartsSpy = spyOn(component, 'loadCarts').and.stub();

    component.clients = [];
    component.setSection('clientes');
    expect(loadClientsSpy).toHaveBeenCalled();

    component.products = [sampleProduct];
    component.setSection('productos');
    expect(loadProductsSpy).not.toHaveBeenCalled();

    component.facturas = [];
    component.setSection('facturas');
    expect(loadFacturasSpy).toHaveBeenCalled();

    (component.carts as any) = [{}];
    component.setSection('carritos');
    expect(loadCartsSpy).not.toHaveBeenCalled();
  });

  it('dashboard debería calcular ventas sumando total directo y derivado de carrito', fakeAsync(() => {
    clienteServiceMock.getAll.and.returnValue(of([sampleClient]));
    productoServiceMock.getAll.and.returnValue(of([sampleProduct]));
    facturaServiceMock.getAll.and.returnValue(of([sampleFacturaWithTotal, sampleFacturaNoTotal]));
    carritoServiceMock.getById.and.callFake((id: string) => {
      if (id === 'C2') {
        return of({ id: 'C2', detalles: [{ cantidad: 2, precio: 50 }] });
      }
      return of({});
    });

    component.setSection('dashboard');
    tick();

    expect(component.stats.totalClientes).toBe(1);
    expect(component.stats.totalProductos).toBe(1);
    expect(component.stats.totalFacturas).toBe(2);
    expect(component.stats.totalVentas).toBe(250);
    expect(component.dashLoading).toBeFalse();
  }));

  it('dashboard debería manejar caso sin facturas y poner totalVentas en 0', fakeAsync(() => {
    clienteServiceMock.getAll.and.returnValue(of([sampleClient]));
    productoServiceMock.getAll.and.returnValue(of([sampleProduct]));
    facturaServiceMock.getAll.and.returnValue(of([]));

    component.setSection('dashboard');
    tick();

    expect(component.stats.totalClientes).toBe(1);
    expect(component.stats.totalProductos).toBe(1);
    expect(component.stats.totalFacturas).toBe(0);
    expect(component.stats.totalVentas).toBe(0);
    expect(component.dashLoading).toBeFalse();
  }));

  it('dashboard debería manejar error y setear dashError', fakeAsync(() => {
    clienteServiceMock.getAll.and.returnValue(throwError(() => new Error('fail')));
    productoServiceMock.getAll.and.returnValue(throwError(() => new Error('fail')));
    facturaServiceMock.getAll.and.returnValue(throwError(() => new Error('fail')));

    component.setSection('dashboard');
    tick();

    expect(component.dashError).toContain('No se pudo cargar el resumen');
    expect(component.dashLoading).toBeFalse();
  }));

  it('dashboard debería limpiar dashError tras una carga exitosa posterior a error', fakeAsync(() => {
    clienteServiceMock.getAll.and.returnValue(throwError(() => new Error('fail')));
    productoServiceMock.getAll.and.returnValue(throwError(() => new Error('fail')));
    facturaServiceMock.getAll.and.returnValue(throwError(() => new Error('fail')));

    component.setSection('dashboard');
    tick();

    expect(component.dashError).toContain('No se pudo cargar el resumen');

    clienteServiceMock.getAll.and.returnValue(of([sampleClient]));
    productoServiceMock.getAll.and.returnValue(of([sampleProduct]));
    facturaServiceMock.getAll.and.returnValue(of([sampleFacturaWithTotal]));

    component.setSection('dashboard');
    tick();

    expect(component.dashError).toBe('');
    expect(component.stats.totalClientes).toBe(1);
    expect(component.stats.totalProductos).toBe(1);
    expect(component.stats.totalFacturas).toBe(1);
    expect(component.stats.totalVentas).toBe(sampleFacturaWithTotal.total as number);
  }));

  it('loadDashboard debería mantener dashLoading activo hasta completar la carga', fakeAsync(() => {
    const clientes$ = new Subject<ClienteDto[]>();
    const productos$ = new Subject<ProductoDto[]>();
    const facturas$ = new Subject<FacturaDto[]>();

    clienteServiceMock.getAll.and.returnValue(clientes$);
    productoServiceMock.getAll.and.returnValue(productos$);
    facturaServiceMock.getAll.and.returnValue(facturas$);

    component.setSection('dashboard');

    expect(component.dashLoading).toBeTrue();

    clientes$.next([sampleClient]);
    clientes$.complete();
    productos$.next([sampleProduct]);
    productos$.complete();
    facturas$.next([sampleFacturaWithTotal]);
    facturas$.complete();
    tick();

    expect(component.dashLoading).toBeFalse();
  }));

  it('viewCartProducts debería alertar lista de productos y manejar vacío', () => {
    const alertSpy = spyOn(window, 'alert').and.stub();

    component.viewCartProducts({ id: 'C1', detalles: [] } as any);
    expect(alertSpy).toHaveBeenCalled();

    alertSpy.calls.reset();
    component.viewCartProducts({
      id: 'C2',
      detalles: [{ producto: { nombre: 'X', precio: 25 }, cantidad: 3 }],
    } as any);
    expect(alertSpy).toHaveBeenCalled();
    const msg = (alertSpy.calls.mostRecent().args[0] as string) || '';
    expect(msg).toContain('Carrito #C2');
    expect(msg).toContain('X');
    expect(msg).toContain('x 3');
  });

  it('afterProductMutation debería limpiar mensajes tras timeout', fakeAsync(() => {
    const loadSpy = spyOn(component, 'loadProducts').and.stub();
    component.pSuccessMessage = 'ok';
    component.pErrorMessage = 'err';
    (component as any).afterProductMutation(false);
    expect(loadSpy).toHaveBeenCalled();
    tick(2500);
    expect(component.pSuccessMessage).toBe('');
    expect(component.pErrorMessage).toBe('');
  }));

  it('setSection debería cargar productos y carritos cuando están vacíos', () => {
    const loadProductsSpy = spyOn(component, 'loadProducts').and.stub();
    const loadCartsSpy = spyOn(component, 'loadCarts').and.stub();

    component.products = [];
    component.setSection('productos');
    expect(loadProductsSpy).toHaveBeenCalled();

    component.carts = [];
    component.setSection('carritos');
    expect(loadCartsSpy).toHaveBeenCalled();
  });

  it('computeFacturaTotal debería devolver 0 cuando getById falla', fakeAsync(() => {
    carritoServiceMock.getById.and.returnValue(throwError(() => new Error('fail')));
    const obs = (component as any).computeFacturaTotal(sampleFacturaNoTotal);
    obs.subscribe((total: number) => expect(total).toBe(0));
    tick();
  }));

  it('computeCartTotal debería manejar valores inválidos', () => {
    expect((component as any).computeCartTotal({ productos: null })).toBe(0);
    expect(
      (component as any).computeCartTotal({ productos: [{ cantidad: 'x', precio: 'y' }] })
    ).toBe(0);
  });

  it('viewCartProducts debería usar valores por defecto', () => {
    const alertSpy = spyOn(window, 'alert').and.stub();
    component.viewCartProducts({
      id: 'C9',
      productos: [{ nombre: undefined, cantidad: undefined, precio: undefined }],
    } as any);
    const message = alertSpy.calls.mostRecent().args[0] as string;
    expect(message).toContain('Producto 1');
  });

  it('calcProductoCount debería priorizar productos sobre detalles', () => {
    const count = (component as any).calcProductoCount({
      productos: [{}, {}],
      detalles: [{}, {}, {}],
    });
    expect(count).toBe(2);
  });

  it('enrichCartWithCliente debería manejar error y conservar idCliente', fakeAsync(() => {
    clienteServiceMock.getByCedula.and.returnValue(throwError(() => new Error('fail')));
    const obs = (component as any).enrichCartWithCliente({
      id: 'C1',
      clienteCedula: '123',
      productos: [{}],
    } as any);
    obs.subscribe((cart: any) => {
      expect(cart.idCliente).toBe('123');
      expect(cart.productoCount).toBe(1);
    });
    tick();
  }));

  it('markHasFactura debería marcar carritos with factura', () => {
    const carts = [{ id: 'C1' }, { id: 'C2' }] as any;
    const facts = [{ idCarrito: 'C2' }] as any;
    const result = (component as any).markHasFactura(carts, facts);
    expect(result.find((c: any) => c.id === 'C2').hasFactura).toBeTrue();
    expect(result.find((c: any) => c.id === 'C1').hasFactura).toBeFalse();
  });

  it('enrichFacturaWithCliente debería usar datos del carrito', fakeAsync(() => {
    carritoServiceMock.getById.and.returnValue(
      of({ cliente: { nombre: 'Ana', correo: 'ana@mail.com' } })
    );
    const obs = (component as any).enrichFacturaWithCliente(sampleFacturaWithTotal);
    obs.subscribe((fact: any) => {
      expect(fact.clienteNombre).toBe('Ana');
      expect(fact.clienteCorreo).toBe('ana@mail.com');
    });
    tick();
  }));

  it('enrichFacturaWithCliente debería consultar cliente por cédula y manejar errores', fakeAsync(() => {
    carritoServiceMock.getById.and.returnValue(
      of({ cliente: null, cedulaCliente: sampleClient.cedula })
    );
    clienteServiceMock.getByCedula.and.returnValue(of(sampleClient));
    let result: any;
    (component as any)
      .enrichFacturaWithCliente(sampleFacturaNoTotal)
      .subscribe((fact: any) => (result = fact));
    tick();
    expect(result.clienteNombre).toBe(sampleClient.nombre);
    expect(result.clienteCorreo).toBe(sampleClient.correo);

    carritoServiceMock.getById.and.returnValue(of({ cliente: null, cedulaCliente: '000' }));
    clienteServiceMock.getByCedula.and.returnValue(throwError(() => new Error('fail')));
    (component as any)
      .enrichFacturaWithCliente(sampleFacturaNoTotal)
      .subscribe((fact: any) => expect(fact).toBe(sampleFacturaNoTotal));
    tick();
  }));

  it('enrichFacturaWithCliente debería retornar factura original si getById falla', fakeAsync(() => {
    carritoServiceMock.getById.and.returnValue(throwError(() => new Error('boom')));
    (component as any)
      .enrichFacturaWithCliente(sampleFacturaNoTotal)
      .subscribe((fact: any) => expect(fact).toBe(sampleFacturaNoTotal));
    tick();
  }));

  it('computeDashboardTotals debería devolver fallback ante error en totales', fakeAsync(() => {
    spyOn(component as any, 'computeFacturaTotal').and.returnValue(
      throwError(() => new Error('fail'))
    );
    let result: any;
    (component as any)
      .computeDashboardTotals([sampleClient], [sampleProduct], [sampleFacturaNoTotal])
      .subscribe((value: any) => (result = value));
    tick();
    expect(result.totalVentas).toBe(0);
    expect(result.totalClientes).toBe(1);
  }));

  it('openEditForm debería limpiar mensajes y clonar cliente', () => {
    component.errorMessage = 'err';
    component.successMessage = 'ok';
    component.isEditing = false;
    component.showForm = false;

    component.openEditForm(sampleClient);

    expect(component.isEditing).toBeTrue();
    expect(component.showForm).toBeTrue();
    expect(component.formData).toEqual(sampleClient);
    expect(component.formData).not.toBe(sampleClient);
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
  });

  it('debería usar arreglo vacío cuando la factura enriquecida es undefined', () => {
    // Arrange
    const factura: FacturaDto = { id: 'F-2', idCarrito: 'C-2' };
    facturaServiceMock.getAll.and.returnValue(of([factura]));
    spyOn<any>(component, 'enrichFacturaWithCliente').and.returnValue(of(undefined));

    // Act
    component.loadFacturas();

    // Assert
    expect(component.facturas).toEqual([]);
    expect(component.fIsLoading).toBeFalse();
  });

  describe('advanced behaviours', () => {
    let confirmSpy: jasmine.Spy;
    let alertSpy: jasmine.Spy;

    beforeEach(() => {
      clienteServiceMock.getAll.and.returnValue(of([]));
      productoServiceMock.getAll.and.returnValue(of([]));
      facturaServiceMock.getAll.and.returnValue(of([]));
      carritoServiceMock.getAll.and.returnValue(of([]));

      component = new AdminComponent(
        clienteServiceMock,
        productoServiceMock,
        facturaServiceMock,
        carritoServiceMock
      );

      confirmSpy = spyOn(window, 'confirm');
      alertSpy = spyOn(window, 'alert');
    });

    it('debería manejar lista nula de facturas', () => {
      // Arrange
      facturaServiceMock.getAll.and.returnValue(of(null as any));

      // Act
      component.loadFacturas();

      // Assert
      expect(component.facturas).toEqual([]);
      expect(component.fIsLoading).toBeFalse();
    });

    it('debería asignar facturas enriquecidas', () => {
      // Arrange
      const factura: FacturaDto = { id: 'F-1', idCarrito: 'C-1' };
      const enriched: FacturaDto = { ...factura, clienteNombre: 'Ana' };
      facturaServiceMock.getAll.and.returnValue(of([factura]));
      spyOn<any>(component, 'enrichFacturaWithCliente').and.returnValue(of(enriched));

      // Act
      component.loadFacturas();

      // Assert
      expect(component.facturas).toEqual([enriched]);
      expect(component.fIsLoading).toBeFalse();
    });

    it('debería filtrar productos ignorando espacios y mayúsculas', () => {
      // Arrange
      const productos: ProductoDto[] = [
        {
          id: 1,
          nombre: 'Sartén',
          descripcion: 'Anti adherente',
          precio: 10,
          existencia: 5,
          peso: 1,
          imagen: '',
        },
        {
          id: 2,
          nombre: 'Olla',
          descripcion: 'Acero',
          precio: 20,
          existencia: 3,
          peso: 2,
          imagen: '',
        },
      ];
      component.products = productos;
      component.filteredProducts = [...productos];
      component.productSearchTerm = '  sart  ';

      // Act
      component.applyProductFilter();

      // Assert
      expect(component.filteredProducts).toEqual([productos[0]]);
    });

    it('debería enviar payload de creación con textos limpiados', () => {
      // Arrange
      component.productFormData = {
        nombre: '  Producto  ',
        descripcion: '  Descripción  ',
        precio: 25,
        existencia: 4,
        peso: 1.5,
        imagen: '  /img.png  ',
      };
      productoServiceMock.create.and.returnValue(of({} as ProductoDto));

      // Act
      component.submitProductForm();

      // Assert
      expect(productoServiceMock.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          id: 0,
          nombre: 'Producto',
          descripcion: 'Descripción',
          imagen: '/img.png',
        })
      );
      expect(component.pIsLoading).toBeFalse();
    });

    it('debería manejar error al crear producto', () => {
      // Arrange
      spyOn(console, 'error');
      component.productFormData = {
        nombre: 'Nuevo',
        descripcion: 'Desc',
        precio: 10,
        existencia: 1,
        peso: 1,
        imagen: '',
      };
      productoServiceMock.create.and.returnValue(throwError(() => new Error('fail')));

      // Act
      component.submitProductForm();

      // Assert
      expect(component.pErrorMessage).toBe('No se pudo crear el producto.');
      expect(component.pIsLoading).toBeFalse();
    });

    it('debería manejar error al actualizar producto', () => {
      // Arrange
      spyOn(console, 'error');
      component.isEditingProduct = true;
      component.productFormData = {
        id: 5,
        nombre: 'Actualizar',
        descripcion: 'Desc',
        precio: 10,
        existencia: 1,
        peso: 1,
        imagen: '',
      };
      productoServiceMock.update.and.returnValue(throwError(() => new Error('boom')));

      // Act
      component.submitProductForm();

      // Assert
      expect(component.pErrorMessage).toBe('No se pudo actualizar el producto.');
      expect(component.pIsLoading).toBeFalse();
    });

    it('no debería eliminar cliente si la confirmación es negativa', () => {
      // Arrange
      confirmSpy.and.returnValue(false);
      const cliente: ClienteDto = {
        cedula: '1',
        nombre: 'Ana',
        direccion: '',
        correo: '',
        telefono: '',
      };

      // Act
      component.confirmDelete(cliente);

      // Assert
      expect(clienteServiceMock.delete).not.toHaveBeenCalled();
    });

    it('debería mostrar detalle cuando backend devuelve 409', () => {
      // Arrange
      confirmSpy.and.returnValue(true);
      const cliente = { cedula: '1', nombre: 'Ana', direccion: '', correo: '', telefono: '' };
      clienteServiceMock.delete.and.returnValue(
        throwError(() => ({ status: 409, error: { detail: 'Tiene facturas' } }))
      );

      // Act
      component.confirmDelete(cliente);

      // Assert
      expect(component.errorMessage).toBe('No se puede eliminar: Tiene facturas');
      expect(component.isLoading).toBeFalse();
    });

    it('debería mostrar mensaje genérico cuando backend devuelve 500', () => {
      // Arrange
      confirmSpy.and.returnValue(true);
      const cliente = { cedula: '2', nombre: 'Luis', direccion: '', correo: '', telefono: '' };
      clienteServiceMock.delete.and.returnValue(throwError(() => ({ status: 500 })));

      // Act
      component.confirmDelete(cliente);

      // Assert
      expect(component.errorMessage).toBe(
        'No se puede eliminar el cliente porque tiene registros asociados (carritos/facturas).'
      );
    });

    it('debería usar mensaje por defecto en error desconocido al eliminar cliente', () => {
      // Arrange
      confirmSpy.and.returnValue(true);
      const cliente = { cedula: '3', nombre: 'Eva', direccion: '', correo: '', telefono: '' };
      clienteServiceMock.delete.and.returnValue(throwError(() => ({ status: 400 })));

      // Act
      component.confirmDelete(cliente);

      // Assert
      expect(component.errorMessage).toBe('No se pudo eliminar el cliente.');
    });

    it('no debería abrir PDF si la factura no tiene id', () => {
      // Act
      component.viewFacturaPdf({ idCarrito: 'C-1' } as FacturaDto);

      // Assert
      expect(facturaServiceMock.openPdfInNewTab).not.toHaveBeenCalled();
    });

    it('no debería enviar email si la factura no tiene id', () => {
      // Act
      component.sendFacturaEmail({ idCarrito: 'C-2' } as FacturaDto);

      // Assert
      expect(facturaServiceMock.sendByEmail).not.toHaveBeenCalled();
      expect(component.fIsLoading).toBeFalse();
    });

    it('no debería eliminar factura sin id', () => {
      // Arrange
      confirmSpy.and.returnValue(true);

      // Act
      component.confirmDeleteFactura({ idCarrito: 'C-3' } as FacturaDto);

      // Assert
      expect(facturaServiceMock.delete).not.toHaveBeenCalled();
    });

    it('debería cargar carritos cuando se selecciona la sección correspondiente', () => {
      // Arrange
      const loadSpy = spyOn(component, 'loadCarts');
      component.carts = [];

      // Act
      component.setSection('carritos');

      // Assert
      expect(loadSpy).toHaveBeenCalled();
    });

    it('debería devolver total cero cuando los items no son arreglo', () => {
      // Act
      const total = (component as any).computeCartTotal({ productos: null });

      // Assert
      expect(total).toBe(0);
    });

    it('debería calcular total del carrito con cantidades mixtas', () => {
      // Arrange
      const cart = {
        productos: [
          { cantidad: '2', precio: '1000' },
          { cantidadProducto: '1', producto: { precio: '500' } },
        ],
      };

      // Act
      const total = (component as any).computeCartTotal(cart);

      // Assert
      expect(total).toBe(2500);
    });

    it('debería mostrar productos de un carrito en un alert', () => {
      // Arrange
      alertSpy.and.stub();
      const cart: CartDto & { productos: any[] } = {
        id: '10',
        detalles: [],
        productos: [{ nombre: 'Sartén', cantidad: 2, precio: 5000 }],
      };

      // Act
      component.viewCartProducts(cart);

      // Assert
      expect(alertSpy).toHaveBeenCalledWith('Carrito #10\n• Sartén x 2 - $5000');
    });

    it('debería enriquecer carrito con datos del cliente', (done) => {
      // Arrange
      clienteServiceMock.getByCedula.and.returnValue(
        of({ nombre: 'Ana', correo: 'ana@mail.com' } as ClienteDto)
      );
      const cart = { id: '1', detalles: [], idCliente: '123' } as unknown as CartDto;

      // Act
      (component as any).enrichCartWithCliente(cart).subscribe((result: any) => {
        // Assert
        expect(result.clienteNombre).toBe('Ana');
        expect(result.clienteCorreo).toBe('ana@mail.com');
        expect(result.productoCount).toBe(0);
        done();
      });
    });

    it('debería marcar carritos with facturas asociadas', () => {
      // Arrange
      const carts = [{ id: '5' } as any, { id: '7' } as any];
      const facts = [{ idCarrito: '7' } as FacturaDto];

      // Act
      const result = (component as any).markHasFactura(carts, facts);

      // Assert
      expect(result[0].hasFactura).toBeFalse();
      expect(result[1].hasFactura).toBeTrue();
    });

    it('debería enriquecer factura usando datos del carrito', (done) => {
      // Arrange
      const factura: FacturaDto = { id: 'F1', idCarrito: 'C1' };
      carritoServiceMock.getById.and.returnValue(
        of({ cliente: { nombre: 'Ana', correo: 'ana@mail.com' } })
      );

      // Act
      (component as any).enrichFacturaWithCliente(factura).subscribe((result: FacturaDto) => {
        // Assert
        expect(result.clienteNombre).toBe('Ana');
        expect(result.clienteCorreo).toBe('ana@mail.com');
        done();
      });
    });

    it('debería devolver factura sin cambios cuando no hay datos del cliente', (done) => {
      // Arrange
      const factura: FacturaDto = { id: 'F2', idCarrito: 'C2' };
      carritoServiceMock.getById.and.returnValue(of({}));

      // Act
      (component as any).enrichFacturaWithCliente(factura).subscribe((result: FacturaDto) => {
        // Assert
        expect(result).toBe(factura);
        done();
      });
    });

    it('debería manejar error al enriquecer factura devolviendo original', (done) => {
      // Arrange
      const factura: FacturaDto = { id: 'F3', idCarrito: 'C3' };
      carritoServiceMock.getById.and.returnValue(throwError(() => new Error('fail')));

      // Act
      (component as any).enrichFacturaWithCliente(factura).subscribe((result: FacturaDto) => {
        // Assert
        expect(result).toBe(factura);
        done();
      });
    });

    it('debería calcular totales del dashboard usando reduce', (done) => {
      // Arrange
      spyOn<any>(component, 'computeFacturaTotal').and.returnValue(of(150));
      const clientes: ClienteDto[] = [
        { cedula: '1', nombre: '', direccion: '', correo: '', telefono: '' },
      ];
      const productos: ProductoDto[] = [
        { id: 1, nombre: '', descripcion: '', precio: 1, existencia: 1, peso: 1, imagen: '' },
      ];
      const facturas: FacturaDto[] = [{ id: 'F', idCarrito: 'C' }];

      // Act
      (component as any)
        .computeDashboardTotals(clientes, productos, facturas)
        .subscribe((stats: any) => {
          // Assert
          expect(stats.totalClientes).toBe(1);
          expect(stats.totalProductos).toBe(1);
          expect(stats.totalFacturas).toBe(1);
          expect(stats.totalVentas).toBe(150);
          done();
        });
    });
  });
});
