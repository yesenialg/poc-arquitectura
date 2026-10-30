import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FuncionDto } from './dto/funcion.dto.js';
import { FuncionesService } from './funciones.service.js';

@ApiTags('funciones')
@Controller({ path: 'funciones', version: '1' })
export class FuncionesController {
  constructor(private readonly funcionesService: FuncionesService) {}

  @Get()
  @ApiOkResponse({ type: FuncionDto, isArray: true })
  findAll(): FuncionDto[] {
    return this.funcionesService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: FuncionDto })
  @ApiNotFoundResponse({ description: 'La función no existe' })
  findOne(@Param('id') id: string): FuncionDto {
    return this.funcionesService.findOne(id);
  }
}
