import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarritoService } from '../../services/cart/cart.service';
import { DetailDto } from '../../services/detail/detail.dto';
import { DetailComponent } from '../detail/detail.component';


@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, DetailComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CarritoComponent implements OnInit {
  carritoId: string = '1'; 
  items: DetailDto[] = [];

  constructor(private cartService: CarritoService) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.cartService.getById(this.carritoId).subscribe({
      next: carrito => {
        this.items = carrito.detalles;
      },
      error: err => console.error('Error cargando carrito:', err)
    });
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + ((item.producto?.precio || 0) * item.cantidad), 0);
  }

  clearCart(): void {
    // Eliminar todos los detalles uno por uno
    this.items.forEach(item => {
      if (item.idProducto) {
        this.cartService.removeDetalle(this.carritoId, item.idProducto).subscribe();
      }
    });
    this.items = [];
  }
}
