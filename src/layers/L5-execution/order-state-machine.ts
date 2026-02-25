import { OrderStatus } from '../../utils/types';
import { logger } from '../../utils/logger';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['submitted', 'failed', 'cancelled'],
  submitted: ['accepted', 'failed', 'cancelled'],
  accepted: ['partial_fill', 'filled', 'cancelled', 'failed'],
  partial_fill: ['filled', 'cancelled', 'failed'],
  filled: [],
  cancelled: [],
  failed: [],
};

export class OrderStateMachine {
  private state: OrderStatus = 'pending';
  private history: { status: OrderStatus; at: Date }[] = [{ status: 'pending', at: new Date() }];

  constructor(private clOrdId: string) {}

  transition(newStatus: OrderStatus): boolean {
    const valid = VALID_TRANSITIONS[this.state];
    if (!valid.includes(newStatus)) {
      logger.warn(
        { clOrdId: this.clOrdId, from: this.state, to: newStatus },
        'Invalid order state transition',
      );
      return false;
    }
    this.state = newStatus;
    this.history.push({ status: newStatus, at: new Date() });
    logger.debug({ clOrdId: this.clOrdId, state: newStatus }, 'Order state transition');
    return true;
  }

  get currentState(): OrderStatus {
    return this.state;
  }

  get stateHistory() {
    return this.history;
  }

  isTerminal(): boolean {
    return ['filled', 'cancelled', 'failed'].includes(this.state);
  }
}
