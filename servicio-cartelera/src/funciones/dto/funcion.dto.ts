import { ApiProperty } from '@nestjs/swagger';

export class FuncionDto {
  @ApiProperty({ example: 'F001' })
  id: string;

  @ApiProperty({ example: 'La casa de Bernarda Alba' })
  obra: string;

  @ApiProperty({ example: 'Sala Principal' })
  sala: string;

  @ApiProperty({ example: '2026-11-14T19:30:00-05:00', format: 'date-time' })
  fecha: string;

  @ApiProperty({ example: 120 })
  sillasDisponibles: number;
}
