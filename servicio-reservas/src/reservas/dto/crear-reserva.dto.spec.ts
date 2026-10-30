import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CrearReservaDto } from './crear-reserva.dto.js';

describe('CrearReservaDto', () => {
  const valido = {
    funcionId: 'F001',
    nombre: 'Ana Gómez',
    email: 'ana.gomez@example.com',
    sillas: 2,
  };

  const errores = (datos: object) =>
    validate(plainToInstance(CrearReservaDto, datos));

  it('un DTO válido no tiene errores', async () => {
    expect(await errores(valido)).toHaveLength(0);
  });

  it.each([
    ['email inválido', { email: 'no-es-email' }, 'email'],
    ['sillas en 0', { sillas: 0 }, 'sillas'],
    ['sillas en 7', { sillas: 7 }, 'sillas'],
    ['nombre de 1 carácter', { nombre: 'A' }, 'nombre'],
    ['funcionId vacío', { funcionId: '' }, 'funcionId'],
  ])('%s genera error', async (_caso, cambio, propiedad) => {
    const resultado = await errores({ ...valido, ...cambio });
    expect(resultado.map((e) => e.property)).toEqual([propiedad]);
  });
});
