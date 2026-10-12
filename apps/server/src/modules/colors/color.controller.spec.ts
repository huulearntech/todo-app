import { Test, TestingModule } from '@nestjs/testing';
import { ColorController } from './color.controller';
import { ColorService } from './color.service';
import { JwtUser } from '../auth/decorators/current-user.decorator';

describe('ColorController', () => {
  let controller: ColorController;
  let service: {
    createColor: jest.Mock;
    getMyColors: jest.Mock;
    getColorByKey: jest.Mock;
    updateColor: jest.Mock;
    deleteColor: jest.Mock;
  };

  const user: JwtUser = {
    id: '11111111-1111-1111-1111-111111111111',
  };

  beforeEach(async () => {
    service = {
      createColor: jest.fn(),
      getMyColors: jest.fn(),
      getColorByKey: jest.fn(),
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
    const dto = { key: 'sky' as const, name: 'Sky Blue' };
    const expected = { ownerId: user.id, ...dto };
    service.createColor.mockResolvedValue(expected);

    const res = await controller.createColor(user, dto);

    expect(service.createColor).toHaveBeenCalledWith(user.id, dto);
    expect(res).toEqual(expected);
  });

  it('getMyColors should call service.getMyColors', async () => {
    const expected = [{ ownerId: user.id, key: 'sky', name: 'Sky Blue' }];
    service.getMyColors.mockResolvedValue(expected);

    const res = await controller.getMyColors(user);

    expect(service.getMyColors).toHaveBeenCalledWith(user.id);
    expect(res).toEqual(expected);
  });

  it('getColorByKey should call service.getColorByKey', async () => {
    const expected = { ownerId: user.id, key: 'sky', name: 'Sky Blue' };
    service.getColorByKey.mockResolvedValue(expected);

    const res = await controller.getColorByKey(user, 'sky');

    expect(service.getColorByKey).toHaveBeenCalledWith(user.id, 'sky');
    expect(res).toEqual(expected);
  });

  it('updateColor should call service.updateColor', async () => {
    const dto = { name: 'Deep Sky Blue' };
    const expected = {
      ownerId: user.id,
      key: 'sky',
      name: 'Deep Sky Blue',
    };
    service.updateColor.mockResolvedValue(expected);

    const res = await controller.updateColor(user, 'sky', dto);

    expect(service.updateColor).toHaveBeenCalledWith(user.id, 'sky', dto);
    expect(res).toEqual(expected);
  });

  it('deleteColor should call service.deleteColor', async () => {
    service.deleteColor.mockResolvedValue(undefined);

    await controller.deleteColor(user, 'sky');

    expect(service.deleteColor).toHaveBeenCalledWith(user.id, 'sky');
  });
});
