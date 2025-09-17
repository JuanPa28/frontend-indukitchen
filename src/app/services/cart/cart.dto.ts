import { ClienteDto } from "../client/client.dto";
import { DetailDto } from "../detail/detail.dto";

export interface CartDto {
    id?: string;
    cedula_cliente?: string;  // Campo que espera el backend
    cliente?: ClienteDto;     // Para respuestas del backend que incluyen cliente completo
    detalles: DetailDto[];
}

// DTO específico para crear carrito en el backend
export interface CreateCartDto {
    idCliente: string;        // Backend espera idCliente (cédula del cliente)
    productoIds: number[];    // Backend espera array de IDs de productos
}
