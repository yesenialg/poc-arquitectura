import { Module } from '@nestjs/common';
import { ReservasModule } from './reservas/reservas.module.js';

@Module({
  imports: [ReservasModule],
})
export class AppModule {}
