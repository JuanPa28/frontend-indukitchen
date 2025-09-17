import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, switchMap } from 'rxjs';
import { CarritoService } from '../../services/cart/cart.service';
import { LocalCartService, LocalCartItem } from '../../services/cart/local-cart.service';
import { ClienteService } from '../../services/client/client.service';
import { ClienteDto } from '../../services/client/client.dto';
import { FacturaService } from '../../services/factura/factura.service';


@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CarritoComponent implements OnInit, OnDestroy {
  items: LocalCartItem[] = [];
  clientForm: FormGroup;
  private cartSubscription?: Subscription;
  private totalSubscription?: Subscription;
  isLoading: boolean = false;
  total: number = 0;
  itemCount: number = 0;

  constructor(
    private cartService: CarritoService,
    private localCartService: LocalCartService,
    private clienteService: ClienteService,
    private facturaService: FacturaService,
    private formBuilder: FormBuilder
  ) {
    this.clientForm = this.formBuilder.group({
      cedula: ['', [Validators.required, Validators.pattern(/^\d{8,10}$/)]],
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      direccion: ['', [Validators.required, Validators.minLength(10)]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
  }

  ngOnInit(): void {
    this.subscribeToLocalCart();
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
    // Suscribirse a cambios en los items del carrito
    this.cartSubscription = this.localCartService.cartItems$.subscribe(items => {
      this.items = items;
      console.log('🔄 Items del carrito actualizados:', this.items);
    });

    // Suscribirse a cambios en el total
    this.totalSubscription = this.localCartService.total$.subscribe(total => {
      this.total = total;
      console.log('💰 Total actualizado:', this.total);
    });
  }

  // Función para optimizar el renderizado de la lista
  trackByProductId(index: number, item: LocalCartItem): any {
    return item.idProducto || index;
  }

  clearCart(): void {
    console.log('🧹 Limpiando carrito local');
    this.localCartService.clearCart();
  }

  // Actualizar cantidad de un producto
  updateQuantity(productId: number, newQuantity: number): void {
    this.localCartService.updateQuantity(productId, newQuantity);
  }

  // Remover un producto específico
  removeProduct(productId: number): void {
    this.localCartService.removeProduct(productId);
  }

  // Manejar error de imagen
  handleImageError(event: any): void {
    const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhjY2NjIiBvcGFjaXR5PSIwLjMiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNzc3Nzc3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zNWVtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+';
    event.target.src = placeholder;
  }

  onSubmit(): void {
    if (this.clientForm.valid && this.items.length > 0) {
      this.isLoading = true;
      const clientData = this.clientForm.value;

      console.log('📋 Datos del formulario:', clientData);

      // Crear objeto cliente con los campos requeridos por el backend
      const cliente: ClienteDto = {
        cedula: clientData.cedula,
        nombre: clientData.nombre,
        direccion: clientData.direccion,
        correo: clientData.correo, // Campo correo que espera el backend
        telefono: clientData.telefono
        // password, disabled, locked eliminados de la BD
      };

      console.log('👤 Cliente a crear:', cliente);

      // Obtener datos del carrito local
      const cartDataForBackend = this.localCartService.getCartDataForBackend();
      console.log('🛒 Datos del carrito local:', cartDataForBackend);

      // Flujo: 1. Crear cliente, 2. Crear carrito con la cédula
      this.clienteService.create(cliente).pipe(
        switchMap(clienteCreado => {
          console.log('✅ Cliente creado exitosamente:', clienteCreado);
          console.log('📝 Estructura completa del cliente creado:', JSON.stringify(clienteCreado, null, 2));
          console.log('🔍 Cédula del cliente creado:', clienteCreado.cedula);

          // Validar que tenemos la cédula antes de continuar
          const cedulaParaCarrito = clienteCreado.cedula || cliente.cedula;
          if (!cedulaParaCarrito) {
            console.error('❌ No se pudo obtener la cédula para crear el carrito!');
            throw new Error('No se pudo obtener la cédula del cliente');
          }

          // Ahora crear el carrito con la cédula del cliente
          console.log('🚀 Iniciando creación del carrito con cédula:', cedulaParaCarrito);
          return this.cartService.createWithClient(
            cedulaParaCarrito,
            cartDataForBackend.detalles
          );
        }),
        switchMap(carritoCreado => {
          console.log('✅ Carrito creado exitosamente en el backend:', carritoCreado);

          // Validar que tenemos el ID del carrito
          if (!carritoCreado.id) {
            throw new Error('El carrito fue creado pero no se recibió el ID');
          }

          // Crear la factura con el ID del carrito
          console.log('🧾 Iniciando creación de factura para carrito:', carritoCreado.id);
          return this.facturaService.createFromCarrito(carritoCreado.id);
        }),
        switchMap(facturaCreada => {
          console.log('✅ Factura creada exitosamente:', facturaCreada);

          // Validar que tenemos el ID de la factura
          if (!facturaCreada.id) {
            throw new Error('La factura fue creada pero no se recibió el ID');
          }

          // Enviar la factura por correo electrónico
          console.log('📧 Enviando factura por email:', facturaCreada.id);
          return this.facturaService.sendByEmail(facturaCreada.id).pipe(
            // Devolver la factura para mostrar en el mensaje de éxito
            switchMap(emailResponse => {
              console.log('✅ Email enviado exitosamente:', emailResponse);
              return [facturaCreada]; // Retornar la factura original
            })
          );
        })
      ).subscribe({
        next: (facturaCreada) => {
          console.log('🎉 Proceso completo: Cliente → Carrito → Factura → Email');

          // Mostrar mensaje de éxito con información de la factura
          this.showSuccessMessage(facturaCreada);

          // Limpiar carrito local y formulario
          this.localCartService.clearCart();
          this.clientForm.reset();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error en el proceso de creación:', error);

          let errorMessage = 'Error al procesar el pedido. Por favor, intenta nuevamente.';

          // Personalizar mensaje según el tipo de error
          if (error.status === 400) {
            errorMessage = 'Los datos enviados no son válidos. Verifica la información.';
          } else if (error.status === 409) {
            errorMessage = 'El cliente ya existe. Intentando crear solo el carrito...';

            // Si el cliente ya existe, intentar crear solo el carrito
            this.handleExistingClient(cliente.cedula, cartDataForBackend.detalles);
            return;
          } else if (error.status === 500) {
            errorMessage = 'Error interno del servidor. Intenta nuevamente más tarde.';
          }

          this.showErrorMessage(errorMessage);
          this.isLoading = false;
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.clientForm.controls).forEach(key => {
        this.clientForm.get(key)?.markAsTouched();
      });

      if (this.items.length === 0) {
        this.showErrorMessage('Tu carrito está vacío. Agrega productos antes de finalizar la compra.');
      } else {
        this.showErrorMessage('Por favor, completa todos los campos requeridos.');
      }
    }
  }

  // Manejar caso donde el cliente ya existe
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
      }
    });
  }

  private showSuccessMessage(factura?: any): void {
    // Crear mensaje de éxito elegante
    const facturaInfo = factura ? `
      <p style="margin: 8px 0 0 0; opacity: 0.8; font-size: 14px;">Factura #${factura.id || 'Generada'}</p>
      <p style="margin: 4px 0 0 0; opacity: 0.7; font-size: 12px;">📧 Enviada a tu correo electrónico</p>
    ` : '';

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
    `;    // Agregar backdrop
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

    // Remover después de 3 segundos
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
