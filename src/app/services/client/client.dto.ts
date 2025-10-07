export interface ClienteDto {
  cedula: string;
  nombre: string;
  direccion: string;
  correo: string;
  telefono: string;
}

export interface ClienteFormDto {
  cedula: string;
  nombre: string;
  direccion: string;
  correo: string;
  telefono: string;
}

export interface CreateClienteBackendDto extends ClienteDto {
  password: string;
  disabled: boolean;
  locked: boolean;
}
