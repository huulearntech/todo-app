import { Test, TestingModule } from '@nestjs/testing';
import { ColorController } from './color.controller';
import { ColorService } from './color.service';
import { JwtUser } from '../auth/decorators/current-user.decorator';

describe('ColorController', () => {
  let controller: ColorController;
  let service: {
    createColor: jest.Mock;
    getMyColors: jest.Mock;
    getColorByHexCode: jest.Mock;
    updateColor: jest.Mock;
    deleteColor: jest.Mock;
  };

  const user: JwtUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'user@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    service = {
      createColor: jest.fn(),
      getMyColors: jest.fn(),
      getColorByHexCode: jest.fn(),
      updateColor: jest.fn(),
      deleteColor: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ColorController],
      providers: [
        {
          provide: ColorService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ColorController>(ColorController);
  });

  it('createColor should call service.createColor', async () => {
    const dto = { hexCode: '#1a2b3c', name: 'Navy' };
    const expected = { ownerId: user.id, ...dto };
    service.createColor.mockResolvedValue(expected);

    const res = await controller.createColor(user, dto);

    expect(service.createColor).toHaveBeenCalledWith(user.id, dto);
    expect(res).toEqual(expected);
  });

  it('getMyColors should call service.getMyColors', async () => {
    const expected = [{ ownerId: user.id, hexCode: '#1a2b3c', name: 'Navy' }];
    service.getMyColors.mockResolvedValue(expected);

    const res = await controller.getMyColors(user);

    expect(service.getMyColors).toHaveBeenCalledWith(user.id);
    expect(res).toEqual(expected);
  });

  it('getColorByHexCode should call service.getColorByHexCode', async () => {
    const expected = { ownerId: user.id, hexCode: '#1a2b3c', name: 'Navy' };
    service.getColorByHexCode.mockResolvedValue(expected);

    const res = await controller.getColorByHexCode(user, '#1a2b3c');

    expect(service.getColorByHexCode).toHaveBeenCalledWith(user.id, '#1a2b3c');
    expect(res).toEqual(expected);
  });

  it('updateColor should call service.updateColor', async () => {
    const dto = { name: 'Dark Navy' };
    const expected = {
      ownerId: user.id,
      hexCode: '#1a2b3c',
      name: 'Dark Navy',
    };
    service.updateColor.mockResolvedValue(expected);

    const res = await controller.updateColor(user, '#1a2b3c', dto);

    expect(service.updateColor).toHaveBeenCalledWith(user.id, '#1a2b3c', dto);
    expect(res).toEqual(expected);
  });

  it('deleteColor should call service.deleteColor', async () => {
    service.deleteColor.mockResolvedValue(undefined);

    await controller.deleteColor(user, '#1a2b3c');

    expect(service.deleteColor).toHaveBeenCalledWith(user.id, '#1a2b3c');
  });
});
