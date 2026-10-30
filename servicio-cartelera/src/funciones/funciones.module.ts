import { Module } from '@nestjs/common';
import { FuncionesController } from './funciones.controller.js';
import { FuncionesService } from './funciones.service.js';

@Module({
  controllers: [FuncionesController],
  providers: [FuncionesService],
})
export class FuncionesModule {}
