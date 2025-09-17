import { ClienteDto } from "../client/client.dto";
import { DetailDto } from "../detail/detail.dto";

export interface CartDto {
    id?: string;
    cliente?: ClienteDto;
    detalles: DetailDto[];
}
