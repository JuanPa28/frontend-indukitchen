import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, switchMap, of } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';
import { CarritoService } from '../../services/cart/cart.service';
import { LocalCartService, LocalCartItem } from '../../services/cart/local-cart.service';
import { ClienteService } from '../../services/client/client.service';
import { ClienteDto } from '../../services/client/client.dto';
import { FacturaService } from '../../services/factura/factura.service';
import { ProcesarCarritoRequestDto } from '../../services/cart/cart.dto';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CarritoComponent implements OnInit, OnDestroy {
  items: LocalCartItem[] = [];
  clientForm: FormGroup;
  private cartSubscription?: Subscription;
  private totalSubscription?: Subscription;
  isLoading: boolean = false;
  total: number = 0;
  itemCount: number = 0;
  private loggedCliente?: ClienteDto;

  constructor(
    private readonly cartService: CarritoService,
    private readonly localCartService: LocalCartService,
    private readonly clienteService: ClienteService,
    private readonly facturaService: FacturaService,
    private readonly formBuilder: FormBuilder,
    private readonly auth: Auth
  ) {
    this.clientForm = this.formBuilder.group({
      cedula: ['', [Validators.required, Validators.pattern(/^\d{8,10}$/)]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      direccion: ['', [Validators.required, Validators.minLength(10)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      metodoPago: [''],
      enviarOtroEmail: [false],
      emailTo: [''],
      emailSubject: [''],
      emailText: [''],
    });
  }

  ngOnInit(): void {
    this.subscribeToLocalCart();
    this.prefillClienteFromAuth();
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.totalSubscription) {
      this.totalSubscription.unsubscribe();
    }
  }

  private subscribeToLocalCart(): void {
    this.cartSubscription = this.localCartService.cartItems$.subscribe((items) => {
      this.items = items;
      console.log('🔄 Items del carrito actualizados:', this.items);
    });

    this.totalSubscription = this.localCartService.total$.subscribe((total) => {
      this.total = total;
      console.log('💰 Total actualizado:', this.total);
    });
  }

  private prefillClienteFromAuth(): void {
    const email = this.auth?.currentUser?.email;
    if (!email) return;

    this.clienteService.getAll().subscribe({
      next: (list) => {
        const cli = (list || []).find(
          (c) => (c.correo || '').toLowerCase().trim() === email.toLowerCase().trim()
        );
        if (cli) {
          this.loggedCliente = cli;
          this.clientForm.patchValue({
            cedula: cli.cedula,
            nombre: cli.nombre,
            direccion: cli.direccion,
            correo: cli.correo,
            telefono: cli.telefono,
          });
        }
      },
      error: () => {},
    });
  }

  trackByProductId(index: number, item: LocalCartItem): any {
    return item.idProducto || index;
  }

  clearCart(): void {
    console.log('🧹 Limpiando carrito local');
    this.localCartService.clearCart();
  }

  updateQuantity(productId: number, newQuantity: number): void {
    this.localCartService.updateQuantity(productId, newQuantity);
  }

  removeProduct(productId: number): void {
    this.localCartService.removeProduct(productId);
  }

  handleImageError(event: any): void {
    const placeholder =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhjY2NjIiBvcGFjaXR5PSIwLjMiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNzc3Nzc3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zNWVtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+';
    event.target.src = placeholder;
  }

  onSubmit(): void {
    if (this.clientForm.valid && this.items.length > 0) {
      this.isLoading = true;

      const req = this.buildProcesarCarritoRequest();
      const cliente: ClienteDto = this.loggedCliente
        ? { ...this.loggedCliente }
        : {
            cedula: this.clientForm.value.cedula.trim(),
            nombre: this.clientForm.value.nombre.trim(),
            direccion: this.clientForm.value.direccion.trim(),
            correo: this.clientForm.value.correo.trim(),
            telefono: this.clientForm.value.telefono.trim(),
          };

      console.debug('➡️ Payload /carritos/procesar (limpio):', req);

      this.cartService
        .process(req)
        .pipe(
          tap((carrito) => console.log('✅ Carrito procesado:', carrito)),
          map(() => ({ factura: null as any })),
          catchError((error) => this.fallbackProcess(cliente)),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: ({ factura }) => {
            this.showSuccessMessage(factura || undefined);
            this.localCartService.clearCart();
            this.clientForm.reset();
          },
          error: (e2) => {
            console.error('💥 Checkout falló completamente:', e2);
            this.showErrorMessage('No se pudo completar tu compra. Intenta nuevamente.');
          },
        });
    } else {
      this.handleFormValidationErrors();
    }
  }

  private buildProcesarCarritoRequest(): ProcesarCarritoRequestDto {
    const v = this.clientForm.value;
    const formCliente: ClienteDto = {
      cedula: v.cedula.trim(),
      nombre: v.nombre.trim(),
      direccion: v.direccion.trim(),
      correo: v.correo.trim(),
      telefono: v.telefono.trim(),
    };
    const cliente: ClienteDto = this.loggedCliente ? { ...this.loggedCliente } : formCliente;
    const productoIds = this.items.map((i) => i.idProducto).filter((id) => !!id);

    return {
      cliente,
      productoIds,
      idMetodoPago: v.metodoPago ? Number(v.metodoPago) : 1,
      ...(v.enviarOtroEmail && v.emailTo?.trim() ? { emailTo: v.emailTo.trim() } : {}),
      ...(v.enviarOtroEmail && v.emailSubject?.trim()
        ? { emailSubject: v.emailSubject.trim() }
        : {}),
      ...(v.enviarOtroEmail && v.emailText?.trim() ? { emailText: v.emailText.trim() } : {}),
    };
  }

  private fallbackProcess(cliente: ClienteDto) {
    console.warn('⚠️ /carritos/procesar falló, usando fallback');
    const detalles = this.localCartService.toBackendFormat();

    return this.cartService.createWithClient(cliente.cedula, detalles).pipe(
      switchMap((carrito) => {
        console.log('✅ Carrito creado (fallback):', carrito);
        const idCarrito = String(carrito?.id || '');
        if (!idCarrito) return of({ factura: null as any });
        return this.facturaService.createFromCarrito(idCarrito).pipe(
          switchMap((factura) => {
            console.log('🧾 Factura creada (fallback):', factura);
            if (!factura?.id) return of({ factura });
            return this.facturaService.sendByEmail(String(factura.id)).pipe(
              tap(() => console.log('📧 Email enviado (fallback)')),
              catchError((e) => {
                console.warn('⚠️ Falló el envío de email (fallback):', e);
                return of(null);
              }),
              map(() => ({ factura }))
            );
          })
        );
      })
    );
  }

  private handleFormValidationErrors(): void {
    Object.keys(this.clientForm.controls).forEach((k) => this.clientForm.get(k)?.markAsTouched());
    if (this.items.length === 0) {
      this.showErrorMessage(
        'Tu carrito está vacío. Agrega productos antes de finalizar la compra.'
      );
    } else {
      this.showErrorMessage('Por favor, completa todos los campos requeridos.');
    }
  }

  private handleExistingClient(cedula: string, detalles: any[]): void {
    console.log('🔄 Cliente ya existe, creando solo el carrito...');

    this.cartService.createWithClient(cedula, detalles).subscribe({
      next: (carritoCreado) => {
        console.log('✅ Carrito creado para cliente existente:', carritoCreado);

        this.showSuccessMessage();
        this.localCartService.clearCart();
        this.clientForm.reset();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al crear carrito para cliente existente:', error);
        this.showErrorMessage('Error al crear el carrito. Por favor, intenta nuevamente.');
        this.isLoading = false;
      },
    });
  }

  private showSuccessMessage(factura?: any): void {
    const facturaInfo = factura
      ? `
      <p style="margin: 8px 0 0 0; opacity: 0.8; font-size: 14px;">Factura #${
        factura.id || 'Generada'
      }</p>
      <p style="margin: 4px 0 0 0; opacity: 0.7; font-size: 12px;">📧 Enviada a tu correo electrónico</p>
    `
      : '';

    const message = document.createElement('div');
    message.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #059669, #10b981);
        color: white;
        padding: 32px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        text-align: center;
        max-width: 400px;
        animation: successPop 0.5s ease-out;
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
        <h3 style="margin: 0 0 8px 0; font-size: 24px;">¡Pedido Realizado!</h3>
        <p style="margin: 0; opacity: 0.9;">Pronto nos pondremos en contacto contigo.</p>
        ${facturaInfo}
      </div>
    `;
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      animation: fadeIn 0.3s ease-out;
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(message);

    setTimeout(() => {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (message.parentNode) message.parentNode.removeChild(message);
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
        message.parentNode.removeChild(message);
      }
    }, 4000);
  }
}
