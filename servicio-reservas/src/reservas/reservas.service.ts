import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CrearReservaDto } from './dto/crear-reserva.dto.js';
import { Reserva } from './entities/reserva.entity.js';

@Injectable()
export class ReservasService {
  private readonly reservas = new Map<string, Reserva>();

  crear(dto: CrearReservaDto): Reserva {
    const reserva: Reserva = {
      id: randomUUID(),
      funcionId: dto.funcionId,
      nombre: dto.nombre,
      email: dto.email,
      sillas: dto.sillas,
      estado: 'CONFIRMADA',
      fechaCreacion: new Date().toISOString(),
    };
    this.reservas.set(reserva.id, reserva);
    return reserva;
  }

  buscarPorId(id: string): Reserva {
    const reserva = this.reservas.get(id);
    if (!reserva) {
      throw new NotFoundException(`La reserva ${id} no existe`);
    }
    return reserva;
  }
}
