import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CrearReservaDto } from './dto/crear-reserva.dto.js';
import { Reserva } from './entities/reserva.entity.js';
import { ReservasService } from './reservas.service.js';

@ApiTags('reservas')
@Controller({ path: 'reservas', version: '1' })
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @ApiCreatedResponse({ type: Reserva })
  @ApiBadRequestResponse({ description: 'Datos de la reserva inválidos' })
  crear(@Body() dto: CrearReservaDto): Reserva {
    return this.reservasService.crear(dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: Reserva })
  @ApiNotFoundResponse({ description: 'La reserva no existe' })
  buscarPorId(@Param('id') id: string): Reserva {
    return this.reservasService.buscarPorId(id);
  }
}
