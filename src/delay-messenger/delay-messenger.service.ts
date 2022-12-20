import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as amqplib from 'amqplib';

import { Channel, Connection, Options } from 'amqplib';
import { ProducerService } from 'src/kafka/producer/producer.service';
const MINUTE_IN_MS = 1 * 1000;
const TIME_UNITY = 'seconds';
export type DelayExchangeOptions = {
  durable: boolean;
  autoDelete: boolean;
};

export type DelayQueueOptions = {
  durable: boolean;
  deadLetterExchange?: string;
};

@Injectable()
export class DelayMessengerService implements OnModuleInit {
  private channel: Channel;
  private connection: Connection;
  private delayExchangeName: string;
  private delayExchangeOptions: DelayExchangeOptions;
  private delayQueuePrefix: string;
  private delayQueueOptions: DelayQueueOptions;
  private delays: number[];

  constructor(
    private configService: ConfigService,
    private producerService: ProducerService,
  ) {
    this.delayExchangeName = 'delay-exchange';
    this.delayExchangeOptions = { durable: true, autoDelete: false };
    this.delayQueuePrefix = 'delay-queue';
    this.delayQueueOptions = {
      ...{ durable: true },
      deadLetterExchange: '', // must be set as Default exchange
    };
    this.delays = [];
  }
  async onModuleInit() {
    this.connection = await amqplib.connect(
      this.configService.get('CLOUDAMQP_CONNECTION'),
    );

    this.channel = await this.connection.createChannel();
    await this.initializeConsumers();

    // define delays on configuration
    await this.setupDelayedTopology([10, 30, 60]);
  }

  async setupDelayedTopology(delays: number[]) {
    // assert headers exchange
    this.delayExchangeName = 'delay-exchange';
    await this.channel.assertExchange(
      this.delayExchangeName,
      'headers',
      this.delayExchangeOptions,
    );

    await Promise.all(
      [...delays].map(async (delay) => {
        if (!Number.isFinite(delay) || delay <= 0)
          throw Error(
            `The delay ${delay} is not valid, it must be an integer.`,
          );

        const delayInMs = delay * MINUTE_IN_MS;
        // assert delay queue for each delay with messageTtl set to the delay
        await this.channel.assertQueue(this.getName(delay), {
          ...this.delayQueueOptions,
          messageTtl: delayInMs,
        });
        // bind delay queue to the headers exchange by matching delay header
        await this.channel.bindQueue(
          this.getName(delay),
          this.delayExchangeName,
          '',
          {
            'x-match': 'all',
            delay: delayInMs,
          },
        );
        this.delays[delay] = delayInMs;
      }),
    );
  }

  sendWithDelay(
    destinationQueue: string,
    content: unknown,
    delay: number,
    options: Options.Publish = {},
  ) {
    if (!this.delays[delay]) throw Error(`Delay ${delay} is not configured`);

    // setup "delay" header
    if (!options.headers) {
      options.headers = {};
    }
    options.headers.delay = this.delays[delay];

    return this.channel.publish(
      this.delayExchangeName,
      destinationQueue,
      Buffer.from(JSON.stringify(content)),
      options,
    );
  }

  getName(delay) {
    return `${this.delayQueuePrefix}-${delay}-${TIME_UNITY}`;
  }

  async initializeConsumers() {
    await this.channel.assertQueue('destinationQueue');

    await this.channel.consume('destinationQueue', (msg) => {
      const data = JSON.parse(msg.content.toString());
      console.log('\nQueued at ', data.queuedAt);
      console.log('Received at ', new Date(), data.message);
      this.producerService.produce({
        topic: 'command_webhook_event',
        messages: [{ value: JSON.stringify(data) }],
      });
      this.channel.ack(msg);
    });
  }
}
