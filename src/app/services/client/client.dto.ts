export interface ClienteDto {
    cedula: string;
    nombre: string;
    direccion: string;
    correo: string;  // Campo que espera el backend
    telefono: string;
    // Campos password, disabled, locked eliminados de la BD
}

// Interface para formulario del frontend (más simple)
export interface ClienteFormDto {
    cedula: string;
    nombre: string;
    direccion: string;
    correo: string;              // Nombre simple para el formulario
    telefono: string;
}
