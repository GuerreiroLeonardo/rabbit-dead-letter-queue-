import { Test, TestingModule } from '@nestjs/testing';
import { DelayMessengerService } from './delay-messenger.service';

describe('DelayMessengerService', () => {
  let service: DelayMessengerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DelayMessengerService],
    }).compile();

    service = module.get<DelayMessengerService>(DelayMessengerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
