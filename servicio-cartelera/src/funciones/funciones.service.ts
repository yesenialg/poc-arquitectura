import { Injectable, NotFoundException } from '@nestjs/common';
import { FuncionDto } from './dto/funcion.dto.js';

@Injectable()
export class FuncionesService {
  private readonly funciones: FuncionDto[] = [
    {
      id: 'F001',
      obra: 'La casa de Bernarda Alba',
      sala: 'Sala Principal',
      fecha: '2026-11-14T19:30:00-05:00',
      sillasDisponibles: 120,
    },
    {
      id: 'F002',
      obra: 'Esperando a Godot',
      sala: 'Sala Experimental',
      fecha: '2026-11-15T20:00:00-05:00',
      sillasDisponibles: 45,
    },
    {
      id: 'F003',
      obra: 'Romeo y Julieta',
      sala: 'Sala Principal',
      fecha: '2026-11-21T18:00:00-05:00',
      sillasDisponibles: 80,
    },
  ];

  findAll(): FuncionDto[] {
    return this.funciones;
  }

  findOne(id: string): FuncionDto {
    const funcion = this.funciones.find((f) => f.id === id);
    if (!funcion) {
      throw new NotFoundException(`La función ${id} no existe`);
    }
    return funcion;
  }
}
