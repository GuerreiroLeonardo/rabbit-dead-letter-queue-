import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { KafkaModule } from 'src/kafka/kafka.module';
import { DelayMessengerService } from './delay-messenger.service';

export const amqpClient = {
  provide: 'PRODUCERS_SERVICE',
  useFactory: (configService: ConfigService) => {
    const cloudAMQPConnection = configService.get('CLOUDAMQP_CONNECTION');
    const cloudAMQPQueue = configService.get('CLOUDAMQO_QUEUE');

    return ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [cloudAMQPConnection],
      },
    });
  },
  isGlobal: true,
  inject: [ConfigService],
};

@Module({
  imports: [KafkaModule],
  providers: [DelayMessengerService, amqpClient, ConfigService],
  exports: [DelayMessengerService],
})
export class DelayMessengerModule {}
