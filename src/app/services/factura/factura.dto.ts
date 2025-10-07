export interface FacturaDto {
  id?: string;
  idCarrito: string;
  fecha?: string;
  total?: number;
  idMetodoPago?: number;
  clienteNombre?: string;
  clienteCorreo?: string;
}

export interface CreateFacturaDto {
  idCarrito: string;
}
