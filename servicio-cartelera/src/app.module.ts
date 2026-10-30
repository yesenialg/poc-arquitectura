import { Module } from '@nestjs/common';
import { FuncionesModule } from './funciones/funciones.module.js';

@Module({
  imports: [FuncionesModule],
})
export class AppModule {}
