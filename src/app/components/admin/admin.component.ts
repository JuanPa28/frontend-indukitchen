import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../services/client/client.service';
import { ClienteDto } from '../../services/client/client.dto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/product/product.service';
import { ProductoDto } from '../../services/product/product.dto';
import { FacturaService } from '../../services/factura/factura.service';
import { CarritoService } from '../../services/cart/cart.service';
import { FacturaDto } from '../../services/factura/factura.dto';
import { CartDto } from '../../services/cart/cart.dto';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

type AdminSection = 'dashboard' | 'clientes' | 'productos' | 'facturas' | 'carritos' | 'pagos';

type EnrichedCart = CartDto & {
  idCliente?: string;
  clienteNombre?: string;
  clienteCorreo?: string;
  productoCount?: number;
  hasFactura?: boolean;
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  clients: ClienteDto[] = [];
  filteredClients: ClienteDto[] = [];

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  searchTerm: string = '';

  showForm: boolean = false;
  isEditing: boolean = false;
  formData: ClienteDto = this.getEmptyForm();

  sections: ReadonlyArray<{ key: AdminSection; label: string; icon: string }> = [
    { key: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { key: 'clientes', label: 'Clientes', icon: 'fa-users' },
    { key: 'productos', label: 'Productos', icon: 'fa-box' },
    { key: 'facturas', label: 'Facturas', icon: 'fa-file-invoice' },
    { key: 'carritos', label: 'Carritos', icon: 'fa-cart-shopping' },
    { key: 'pagos', label: 'Pagos', icon: 'fa-credit-card' },
  ];
  activeSection: AdminSection = 'dashboard';
  navCollapsed = false;

  dashLoading = false;
  dashError = '';
  stats = {
    totalClientes: 0,
    totalProductos: 0,
    totalFacturas: 0,
    totalVentas: 0,
  };

  products: ProductoDto[] = [];
  filteredProducts: ProductoDto[] = [];
  productSearchTerm: string = '';

  pIsLoading: boolean = false;
  pErrorMessage: string = '';
  pSuccessMessage: string = '';

  showProductForm: boolean = false;
  isEditingProduct: boolean = false;
  productFormData: Partial<ProductoDto> = this.getEmptyProductForm();

  facturas: FacturaDto[] = [];
  fIsLoading: boolean = false;
  fErrorMessage: string = '';
  fSuccessMessage: string = '';

  carts: EnrichedCart[] = [];
  cIsLoading = false;
  cErrorMessage = '';
  cSuccessMessage = '';

  readonly productPlaceholder: string =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="100%25" height="100%25" fill="%23f3f4f6"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="10">Sin imagen</text></svg>';

  constructor(
    private readonly clienteService: ClienteService,
    private readonly productoService: ProductoService,
    private readonly facturaService: FacturaService,
    private readonly carritoService: CarritoService
  ) {}

  ngOnInit(): void {
    this.setSection('dashboard');
  }

  private getEmptyForm(): ClienteDto {
    return {
      cedula: '',
      nombre: '',
      direccion: '',
      correo: '',
      telefono: '',
    };
  }

  private getEmptyProductForm(): Partial<ProductoDto> {
    return {
      nombre: '',
      descripcion: '',
      precio: 0,
      existencia: 0,
      peso: 0,
      imagen: '',
    };
  }

  loadClients(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.clienteService.getAll().subscribe({
      next: (data) => {
        this.clients = data || [];
        this.filteredClients = [...this.clients];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar clientes', err);
        this.errorMessage = 'No se pudieron cargar los clientes.';
        this.isLoading = false;
      },
    });
  }

  loadProducts(): void {
    this.pIsLoading = true;
    this.pErrorMessage = '';
    this.productoService.getAll().subscribe({
      next: (data) => {
        this.products = data || [];
        this.filteredProducts = [...this.products];
        this.pIsLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar productos', err);
        this.pErrorMessage = 'No se pudieron cargar los productos.';
        this.pIsLoading = false;
      },
    });
  }

  loadFacturas(): void {
    this.fIsLoading = true;
    this.fErrorMessage = '';
    this.fSuccessMessage = '';

    this.facturaService
      .getAll()
      .pipe(
        switchMap((list) => {
          const facturas = list || [];
          if (facturas.length === 0) return of(facturas);
          return forkJoin(facturas.map((f) => this.enrichFacturaWithCliente(f)));
        })
      )
      .subscribe({
        next: (enriched) => {
          this.facturas = (enriched || []).filter((f): f is FacturaDto => !!f);
          this.fIsLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar/enriquecer facturas', err);
          this.fErrorMessage = 'No se pudieron cargar las facturas.';
          this.fIsLoading = false;
        },
      });
  }

  loadCarts(): void {
    this.cIsLoading = true;
    this.cErrorMessage = '';
    this.cSuccessMessage = '';

    this.carritoService
      .getAll()
      .pipe(
        switchMap((list: CartDto[]) => {
          const carritos = list || [];
          if (carritos.length === 0) return of([] as EnrichedCart[]);
          return forkJoin(carritos.map((c) => this.enrichCartWithCliente(c)));
        }),
        switchMap((enriched: EnrichedCart[]) =>
          this.facturaService.getAll().pipe(
            map((facts) => this.markHasFactura(enriched, facts)),
            catchError(() => of(enriched))
          )
        )
      )
      .subscribe({
        next: (result) => {
          this.carts = result;
          this.cIsLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar carritos', err);
          this.cErrorMessage = 'No se pudieron cargar los carritos.';
          this.cIsLoading = false;
        },
      });
  }

  applyFilter(): void {
    const term = (this.searchTerm || '').toLowerCase().trim();
    this.filteredClients = this.clients.filter(
      (c) => c.cedula.toLowerCase().includes(term) || c.nombre.toLowerCase().includes(term)
    );
  }

  applyProductFilter(): void {
    const term = (this.productSearchTerm || '').toLowerCase().trim();
    this.filteredProducts = this.products.filter(
      (p) =>
        (p.nombre || '').toLowerCase().includes(term) ||
        (p.descripcion || '').toLowerCase().includes(term)
    );
  }

  openCreateForm(): void {
    this.isEditing = false;
    this.formData = this.getEmptyForm();
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  openEditForm(client: ClienteDto): void {
    this.isEditing = true;
    this.formData = { ...client };
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeForm(): void {
    this.showForm = false;
    this.formData = this.getEmptyForm();
    this.isEditing = false;
  }

  openCreateProductForm(): void {
    this.isEditingProduct = false;
    this.productFormData = this.getEmptyProductForm();
    this.showProductForm = true;
    this.pErrorMessage = '';
    this.pSuccessMessage = '';
  }

  openEditProductForm(product: ProductoDto): void {
    this.isEditingProduct = true;
    this.productFormData = { ...product };
    this.showProductForm = true;
    this.pErrorMessage = '';
    this.pSuccessMessage = '';
  }

  closeProductForm(): void {
    this.showProductForm = false;
    this.productFormData = this.getEmptyProductForm();
    this.isEditingProduct = false;
  }

  submitForm(): void {
    if (
      !this.formData.cedula?.trim() ||
      !this.formData.nombre?.trim() ||
      !this.formData.direccion?.trim() ||
      !this.formData.correo?.trim() ||
      !this.formData.telefono?.trim()
    ) {
      this.errorMessage = 'Todos los campos son obligatorios.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.isEditing) {
      this.clienteService.update(this.formData).subscribe({
        next: (resp) => {
          this.successMessage = 'Cliente actualizado correctamente.';
          this.afterMutation();
        },
        error: (err) => {
          console.error('Error al actualizar cliente', err);
          this.errorMessage = 'No se pudo actualizar el cliente.';
          this.isLoading = false;
        },
      });
    } else {
      this.clienteService.create(this.formData).subscribe({
        next: (resp) => {
          this.successMessage = 'Cliente creado correctamente.';
          this.afterMutation();
        },
        error: (err) => {
          console.error('Error al crear cliente', err);
          this.errorMessage = 'No se pudo crear el cliente.';
          this.isLoading = false;
        },
      });
    }
  }

  submitProductForm(): void {
    if (
      !this.productFormData.nombre?.trim() ||
      !this.productFormData.descripcion?.trim() ||
      this.productFormData.precio === undefined ||
      this.productFormData.existencia === undefined ||
      this.productFormData.peso === undefined
    ) {
      this.pErrorMessage = 'Todos los campos marcados con * son obligatorios.';
      return;
    }

    const payload: ProductoDto = {
      id: Number(this.productFormData.id ?? 0),
      nombre: (this.productFormData.nombre ?? '').trim(),
      descripcion: (this.productFormData.descripcion ?? '').trim(),
      precio: Number(this.productFormData.precio),
      existencia: Number(this.productFormData.existencia),
      peso: Number(this.productFormData.peso),
      imagen: (this.productFormData.imagen || '').trim(),
    };

    if (payload.precio < 0 || payload.existencia < 0 || payload.peso < 0) {
      this.pErrorMessage = 'Precio, existencia y peso deben ser valores positivos.';
      return;
    }

    this.pIsLoading = true;
    this.pErrorMessage = '';
    this.pSuccessMessage = '';

    const req$ = this.isEditingProduct
      ? this.productoService.update(payload)
      : this.productoService.create(payload);

    req$.subscribe({
      next: () => {
        this.pSuccessMessage = this.isEditingProduct
          ? 'Producto actualizado correctamente.'
          : 'Producto creado correctamente.';
        this.afterProductMutation();
      },
      error: (err) => {
        console.error(
          this.isEditingProduct ? 'Error al actualizar producto' : 'Error al crear producto',
          err
        );
        this.pErrorMessage = this.isEditingProduct
          ? 'No se pudo actualizar el producto.'
          : 'No se pudo crear el producto.';
        this.pIsLoading = false;
      },
    });
  }

  confirmDelete(client: ClienteDto): void {
    const ok = window.confirm(`¿Eliminar al cliente ${client.nombre} (${client.cedula})?`);
    if (!ok) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.clienteService.delete(client.cedula).subscribe({
      next: () => {
        this.successMessage = 'Cliente eliminado correctamente.';
        this.afterMutation(false);
      },
      error: (err) => {
        console.error('Error al eliminar cliente', err);
        if (err?.status === 409) {
          const detail = (err.error && (err.error.detail || err.error.message)) || '';
          this.errorMessage = detail
            ? `No se puede eliminar: ${detail}`
            : 'No se puede eliminar el cliente porque tiene carritos o facturas asociados.';
        } else if (err?.status === 404) {
          this.errorMessage = 'El cliente no existe o ya fue eliminado.';
        } else if (err?.status === 500) {
          this.errorMessage =
            'No se puede eliminar el cliente porque tiene registros asociados (carritos/facturas).';
        } else {
          this.errorMessage = 'No se pudo eliminar el cliente.';
        }
        this.isLoading = false;
      },
    });
  }

  confirmDeleteProduct(product: ProductoDto): void {
    const ok = window.confirm(`¿Eliminar el producto "${product.nombre}" (ID ${product.id})?`);
    if (!ok) return;

    this.pIsLoading = true;
    this.pErrorMessage = '';
    this.pSuccessMessage = '';

    this.productoService.delete(product.id).subscribe({
      next: () => {
        this.pSuccessMessage = 'Producto eliminado correctamente.';
        this.afterProductMutation(false);
      },
      error: (err) => {
        console.error('Error al eliminar producto', err);
        this.pErrorMessage = 'No se pudo eliminar el producto.';
        this.pIsLoading = false;
      },
    });
  }

  confirmDeleteCart(cart: CartDto & { id?: string; hasFactura?: boolean }): void {
    const id = cart?.id;
    if (!id) return;

    if (cart?.hasFactura) {
      this.cErrorMessage = 'No se puede eliminar el carrito porque tiene una factura asociada.';
      return;
    }

    const ok = window.confirm(`¿Eliminar el carrito #${id}?`);
    if (!ok) return;

    this.cIsLoading = true;
    this.cErrorMessage = '';
    this.cSuccessMessage = '';

    this.carritoService.delete(String(id)).subscribe({
      next: () => {
        this.cSuccessMessage = 'Carrito eliminado correctamente.';
        this.loadCarts();
      },
      error: (err) => {
        console.error('Error al eliminar carrito', err);
        this.cErrorMessage =
          err?.status === 409 || err?.status === 500
            ? 'No se puede eliminar el carrito porque tiene registros asociados.'
            : 'No se pudo eliminar el carrito.';
        this.cIsLoading = false;
      },
    });
  }

  viewFacturaPdf(f: FacturaDto): void {
    if (!f?.id) return;
    this.facturaService.openPdfInNewTab(f.id);
  }

  sendFacturaEmail(f: FacturaDto): void {
    if (!f?.id) return;
    this.fIsLoading = true;
    this.fErrorMessage = '';
    this.fSuccessMessage = '';
    this.facturaService.sendByEmail(String(f.id)).subscribe({
      next: () => {
        this.fSuccessMessage = 'Factura enviada por correo.';
        this.fIsLoading = false;
      },
      error: (err) => {
        console.error('Error al enviar factura por email', err);
        this.fErrorMessage = 'No se pudo enviar la factura por email.';
        this.fIsLoading = false;
      },
    });
  }

  confirmDeleteFactura(f: FacturaDto): void {
    if (!f?.id) return;
    const ok = window.confirm(`¿Eliminar la factura #${f.id}?`);
    if (!ok) return;

    this.fIsLoading = true;
    this.fErrorMessage = '';
    this.fSuccessMessage = '';
    this.facturaService.delete(String(f.id)).subscribe({
      next: () => {
        this.fSuccessMessage = 'Factura eliminada correctamente.';
        this.loadFacturas();
      },
      error: (err) => {
        console.error('Error al eliminar factura', err);
        this.fErrorMessage = 'No se pudo eliminar la factura.';
        this.fIsLoading = false;
      },
    });
  }

  private afterMutation(closeForm: boolean = true): void {
    this.loadClients();
    if (closeForm) this.closeForm();
    this.isLoading = false;

    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 2500);
  }

  private afterProductMutation(closeForm: boolean = true): void {
    this.loadProducts();
    if (closeForm) this.closeProductForm();
    this.pIsLoading = false;

    setTimeout(() => {
      this.pSuccessMessage = '';
      this.pErrorMessage = '';
    }, 2500);
  }

  onProductImageError(event: any): void {
    const img = event?.target as HTMLImageElement;
    img.onerror = null;
    img.src = this.productPlaceholder;
  }

  trackByCedula(index: number, item: ClienteDto) {
    return item.cedula;
  }

  trackByProductId(index: number, item: ProductoDto) {
    return item.id;
  }

  trackByFacturaId(index: number, item: FacturaDto) {
    return item.id;
  }

  trackByCartId(index: number, item: CartDto) {
    return item.id;
  }

  toggleNav(): void {
    this.navCollapsed = !this.navCollapsed;
  }

  setSection(section: AdminSection): void {
    this.activeSection = section;

    switch (section) {
      case 'dashboard':
        this.loadDashboard();
        break;
      case 'clientes':
        if (!this.clients || this.clients.length === 0) {
          this.loadClients();
        }
        break;
      case 'productos':
        if (!this.products || this.products.length === 0) {
          this.loadProducts();
        }
        break;
      case 'facturas':
        if (!this.facturas || this.facturas.length === 0) this.loadFacturas();
        break;
      case 'carritos':
        if (!this.carts || this.carts.length === 0) this.loadCarts();
        break;
      default:
        break;
    }
  }

  private loadDashboard(): void {
    this.dashLoading = true;
    this.dashError = '';

    forkJoin({
      clientes: this.clienteService.getAll(),
      productos: this.productoService.getAll(),
      facturas: this.facturaService.getAll(),
    })
      .pipe(
        switchMap(({ clientes, productos, facturas }) =>
          this.computeDashboardTotals(clientes, productos, facturas)
        )
      )
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.dashLoading = false;
        },
        error: (err) => {
          console.error('Error cargando dashboard:', err);
          this.dashError = 'No se pudo cargar el resumen';
          this.dashLoading = false;
        },
      });
  }

  private computeFacturaTotal(f: FacturaDto): import('rxjs').Observable<number> {
    const rawTotal = (f as any)?.total;
    if (typeof rawTotal === 'number' && !isNaN(rawTotal) && rawTotal > 0) {
      return of(rawTotal);
    }
    return this.carritoService.getById(f.idCarrito).pipe(
      map((cart: any) => this.computeCartTotal(cart)),
      catchError(() => of(0))
    );
  }

  private computeCartTotal(cart: any): number {
    const items = (cart && (cart.productos || cart.detalles)) || [];
    if (!Array.isArray(items)) return 0;

    return items.reduce((sum: number, it: any) => {
      const qty = Number(it?.cantidad ?? it?.cantidadProducto ?? 1);
      const price = Number(it?.precio ?? it?.producto?.precio ?? 0);
      if (isNaN(qty) || isNaN(price)) return sum;
      return sum + qty * price;
    }, 0);
  }

  viewCartProducts(cart: CartDto & { productos?: any[]; detalles?: any[] }): void {
    const productos = (cart as any)?.productos || (cart as any)?.detalles || [];
    if (!Array.isArray(productos) || productos.length === 0) {
      window.alert(`Carrito #${cart.id}: sin productos`);
      return;
    }

    const lines = productos.map((p: any, i: number) => {
      const nombre = p?.nombre || p?.producto?.nombre || `Producto ${i + 1}`;
      const cantidad = p?.cantidad ?? p?.cantidadProducto ?? '';
      const precio = p?.precio ?? p?.producto?.precio ?? '';
      const qty = cantidad ? ` x ${cantidad}` : '';
      const price = precio ? ` - $${precio}` : '';
      return `• ${nombre}${qty}${price}`;
    });

    window.alert(`Carrito #${cart.id}\n${lines.join('\n')}`);
  }

  private extractClienteIdFromCart(c: any): string | undefined {
    return c?.idCliente ?? c?.cedula_cliente ?? c?.clienteCedula ?? c?.cedulaCliente;
  }

  private calcProductoCount(c: any): number {
    return (
      (Array.isArray(c?.productos) ? c.productos.length : 0) ||
      (Array.isArray(c?.detalles) ? c.detalles.length : 0)
    );
  }

  private enrichCartWithCliente(c: CartDto): import('rxjs').Observable<EnrichedCart> {
    const idCliente = this.extractClienteIdFromCart(c);
    const productoCount = this.calcProductoCount(c);

    if (!idCliente) {
      return of({ ...(c as EnrichedCart), productoCount });
    }

    return this.clienteService.getByCedula(String(idCliente)).pipe(
      map((cli) => ({
        ...(c as EnrichedCart),
        idCliente: String(idCliente),
        productoCount,
        clienteNombre: cli?.nombre,
        clienteCorreo: cli?.correo,
      })),
      catchError(() => of({ ...(c as EnrichedCart), idCliente: String(idCliente), productoCount }))
    );
  }

  private markHasFactura(carts: EnrichedCart[], facts: FacturaDto[]): EnrichedCart[] {
    const set = new Set((facts || []).map((f) => String(f.idCarrito)));
    return carts.map((c) => ({ ...c, hasFactura: set.has(String((c as any).id)) }));
  }

  private enrichFacturaWithCliente(f: FacturaDto): import('rxjs').Observable<FacturaDto> {
    return this.carritoService.getById(f.idCarrito).pipe(
      switchMap((carrito: any) => {
        const cliObj = carrito?.cliente;
        const nombre = cliObj?.nombre;
        const correo = cliObj?.correo;
        const cedula =
          cliObj?.cedula ?? carrito?.cedulaCliente ?? carrito?.clienteCedula ?? carrito?.idCliente;

        if (nombre || correo) {
          return of({
            ...f,
            clienteNombre: nombre ?? (f as any).clienteNombre,
            clienteCorreo: correo ?? (f as any).clienteCorreo,
          } as FacturaDto);
        }

        if (cedula) {
          return this.clienteService.getByCedula(String(cedula)).pipe(
            map(
              (cli) =>
                ({
                  ...f,
                  clienteNombre: cli?.nombre ?? (f as any).clienteNombre,
                  clienteCorreo: cli?.correo ?? (f as any).clienteCorreo,
                } as FacturaDto)
            ),
            catchError(() => of(f))
          );
        }

        return of(f);
      }),
      catchError(() => of(f))
    );
  }

  private computeDashboardTotals(
    clientes: ClienteDto[],
    productos: ProductoDto[],
    facturas: FacturaDto[]
  ): import('rxjs').Observable<{
    totalClientes: number;
    totalProductos: number;
    totalFacturas: number;
    totalVentas: number;
  }> {
    const totalClientes = clientes?.length || 0;
    const totalProductos = productos?.length || 0;
    const totalFacturas = facturas?.length || 0;

    if (!facturas || facturas.length === 0) {
      return of({ totalClientes, totalProductos, totalFacturas, totalVentas: 0 });
    }

    const totals$ = facturas.map((f: any) => this.computeFacturaTotal(f));
    return forkJoin(totals$).pipe(
      map((ventas) => ({
        totalClientes,
        totalProductos,
        totalFacturas,
        totalVentas: ventas.reduce((acc, n) => acc + (Number(n) || 0), 0),
      })),
      catchError(() => of({ totalClientes, totalProductos, totalFacturas, totalVentas: 0 }))
    );
  }
}
