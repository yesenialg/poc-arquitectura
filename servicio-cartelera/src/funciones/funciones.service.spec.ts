import { NotFoundException } from '@nestjs/common';
import { FuncionesService } from './funciones.service.js';

describe('FuncionesService', () => {
  let service: FuncionesService;

  beforeEach(() => {
    service = new FuncionesService();
  });

  it('findAll devuelve las 3 funciones', () => {
    expect(service.findAll()).toHaveLength(3);
  });

  it('findOne devuelve la función F001', () => {
    expect(service.findOne('F001')).toMatchObject({ id: 'F001' });
  });

  it('findOne lanza NotFoundException si la función no existe', () => {
    expect(() => service.findOne('F999')).toThrow(NotFoundException);
  });
});
