import { ProductoDto } from "../product/product.dto";

export interface DetailDto {
    idCarrito?: string;
    idProducto: number;       // Requerido para crear detalles
    producto?: ProductoDto;   // Opcional, puede ser incluido o no
    cantidad: number;         // Requerido
}
