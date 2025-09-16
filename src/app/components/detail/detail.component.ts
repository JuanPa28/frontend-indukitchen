import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetailDto } from '../../services/detail/detail.dto';
import { CarritoService } from '../../services/cart/cart.service';

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent {
  @Input() detalle!: DetailDto;
  carritoId: string = '1'; // mismo ID que en CarritoComponent

  constructor(private cartService: CarritoService) {}

  increase(): void {
    this.detalle.cantidad++;
    this.cartService.updateDetalle(this.carritoId, this.detalle).subscribe();
  }

  decrease(): void {
    if (this.detalle.cantidad > 1) {
      this.detalle.cantidad--;
      this.cartService.updateDetalle(this.carritoId, this.detalle).subscribe();
    } else if (this.detalle.idProducto) {
      this.remove();
    }
  }

  remove(): void {
    if (this.detalle.idProducto) {
      this.cartService.removeDetalle(this.carritoId, this.detalle.idProducto).subscribe();
    }
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'https://via.placeholder.com/80x80?text=Sin+Img';
  } 
}
