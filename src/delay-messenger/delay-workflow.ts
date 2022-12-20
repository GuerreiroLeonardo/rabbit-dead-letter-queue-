export interface IRabbitMQBase {
  consume(): Promise<void>;
  produce(): Promise<void>;
  setup(): Promise<void>;
}

export abstract class DelayWorkflowBase {}

export class DelayWorkflow implements IRabbitMQBase {
  async consume() {
    return;
  }
  async produce() {
    return;
  }
  async setup() {
    return;
  }
}
