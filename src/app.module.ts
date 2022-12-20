import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DelayMessengerModule } from './delay-messenger/delay-messenger.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [DelayMessengerModule, KafkaModule],
  controllers: [AppController],
  providers: [AppService, ConfigService],
  exports: [],
})
export class AppModule {}
