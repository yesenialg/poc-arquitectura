import { NotFoundException } from '@nestjs/common';
import { ReservasService } from './reservas.service.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('ReservasService', () => {
  let service: ReservasService;
  const dto = {
    funcionId: 'F001',
    nombre: 'Ana Gómez',
    email: 'ana.gomez@example.com',
    sillas: 2,
  };

  beforeEach(() => {
    service = new ReservasService();
  });

  it('crear devuelve un UUID, estado CONFIRMADA y los datos enviados', () => {
    const reserva = service.crear(dto);
    expect(reserva.id).toMatch(UUID_REGEX);
    expect(reserva.estado).toBe('CONFIRMADA');
    expect(reserva).toMatchObject(dto);
  });

  it('buscarPorId devuelve una reserva existente', () => {
    const creada = service.crear(dto);
    expect(service.buscarPorId(creada.id)).toEqual(creada);
  });

  it('buscarPorId lanza NotFoundException si la reserva no existe', () => {
    expect(() => service.buscarPorId('no-existe')).toThrow(NotFoundException);
  });
});
