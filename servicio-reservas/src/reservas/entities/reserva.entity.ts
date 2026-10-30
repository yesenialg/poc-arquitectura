import { ApiProperty } from '@nestjs/swagger';

export class Reserva {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'F001' })
  funcionId: string;

  @ApiProperty({ example: 'Ana Gómez' })
  nombre: string;

  @ApiProperty({ example: 'ana.gomez@example.com' })
  email: string;

  @ApiProperty({ example: 2 })
  sillas: number;

  @ApiProperty({ enum: ['CONFIRMADA'] })
  estado: 'CONFIRMADA';

  @ApiProperty({ format: 'date-time' })
  fechaCreacion: string;
}
