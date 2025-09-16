import { ProductoDto } from "../product/product.dto";

export interface DetailDto {
    idCarrito?: string;
    idProducto?: number;
    producto?: ProductoDto;
    cantidad: number;
}
