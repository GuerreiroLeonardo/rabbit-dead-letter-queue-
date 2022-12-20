import { Module } from '@nestjs/common';
import { ConsumerService } from './consumer/consumer.service';
import { ProducerService } from './producer/producer.service';

@Module({
  providers: [ProducerService, ConsumerService],
  exports: [ProducerService, ConsumerService],
})
export class KafkaModule {}
