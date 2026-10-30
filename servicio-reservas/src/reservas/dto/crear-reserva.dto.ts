import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CrearReservaDto {
  @ApiProperty({ example: 'F001' })
  @IsString()
  @IsNotEmpty()
  funcionId: string;

  @ApiProperty({ example: 'Ana Gómez', minLength: 2, maxLength: 100 })
  @IsString()
  @Length(2, 100)
  nombre: string;

  @ApiProperty({ example: 'ana.gomez@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 6 })
  @IsInt()
  @Min(1)
  @Max(6)
  sillas: number;
}
