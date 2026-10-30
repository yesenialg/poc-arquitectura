import { Test } from '@nestjs/testing';
import { FuncionesController } from './funciones.controller.js';
import { FuncionesService } from './funciones.service.js';

describe('FuncionesController', () => {
  let controller: FuncionesController;
  const funcion = {
    id: 'F001',
    obra: 'Obra de prueba',
    sala: 'Sala 1',
    fecha: '2026-11-14T19:30:00-05:00',
    sillasDisponibles: 10,
  };
  const serviceMock = {
    findAll: vi.fn().mockReturnValue([funcion]),
    findOne: vi.fn().mockReturnValue(funcion),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FuncionesController],
      providers: [{ provide: FuncionesService, useValue: serviceMock }],
    }).compile();

    controller = moduleRef.get(FuncionesController);
  });

  it('findAll delega en el service', () => {
    expect(controller.findAll()).toEqual([funcion]);
    expect(serviceMock.findAll).toHaveBeenCalled();
  });

  it('findOne delega en el service con el id recibido', () => {
    expect(controller.findOne('F001')).toEqual(funcion);
    expect(serviceMock.findOne).toHaveBeenCalledWith('F001');
  });
});
