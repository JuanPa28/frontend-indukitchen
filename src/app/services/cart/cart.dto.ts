import { ClienteDto } from '../client/client.dto';
import { DetailDto } from '../detail/detail.dto';

export interface CartDto {
  id?: string;
  cedula_cliente?: string;
  cliente?: ClienteDto;
  detalles: DetailDto[];
}

export interface CreateCartDto {
  idCliente: string;
  productoIds: number[];
}

export interface ProcesarCarritoRequestDto {
  cliente: ClienteDto;
  productoIds: number[];
  idMetodoPago?: number | null;
  emailTo?: string | null;
  emailSubject?: string | null;
  emailText?: string | null;
}
