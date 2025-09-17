export interface FacturaDto {
    id?: string;
    idCarrito: string;
    fecha?: string;
    total?: number;
    // Otros campos que pueda retornar el backend
}

// DTO específico para crear factura en el backend
export interface CreateFacturaDto {
    idCarrito: string;
}
