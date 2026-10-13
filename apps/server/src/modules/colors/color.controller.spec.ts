import { Test, TestingModule } from '@nestjs/testing';
import { ColorController } from './color.controller';
import { ColorService } from './color.service';

describe('ColorController', () => {
  let controller: ColorController;
  let service: {
    getColors: jest.Mock;
    getColorByKey: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getColors: jest.fn(),
      getColorByKey: jest.fn(),
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

  it('getColors should call service.getColors', async () => {
    const expected = [{ key: 'sky', name: 'Sky Blue' }];
    service.getColors.mockResolvedValue(expected);

    const res = await controller.getColors();

    expect(service.getColors).toHaveBeenCalledWith();
    expect(res).toEqual(expected);
  });

  it('getColorByKey should call service.getColorByKey', async () => {
    const expected = { key: 'sky', name: 'Sky Blue' };
    service.getColorByKey.mockResolvedValue(expected);

    const res = await controller.getColorByKey('sky');

    expect(service.getColorByKey).toHaveBeenCalledWith('sky');
    expect(res).toEqual(expected);
  });
});
