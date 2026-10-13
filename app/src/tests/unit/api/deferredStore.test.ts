import { describe, expect, test } from 'vitest';
import { deferredStore } from '@/api/deferredStore';

interface CounterStore {
  increment: (by: number) => Promise<number>;
  read: () => Promise<number>;
}

class InMemoryCounterStore implements CounterStore {
  private total = 0;

  async increment(by: number): Promise<number> {
    this.total += by;
    return this.total;
  }

  async read(): Promise<number> {
    return this.total;
  }
}

describe('deferredStore', () => {
  test('given a call before the store is known then it runs once the store resolves', async () => {
    // Given
    let provideStore: (store: CounterStore) => void = () => {};
    const storeKnown = new Promise<CounterStore>((resolve) => {
      provideStore = resolve;
    });
    const deferred = deferredStore(() => storeKnown, { increment: true, read: true });
    const counter = new InMemoryCounterStore();

    // When
    const incremented = deferred.increment(2);
    provideStore(counter);

    // Then
    expect(await incremented).toBe(2);
    expect(await counter.read()).toBe(2);
  });

  test('given a class-based store then its methods run with the store as `this`', async () => {
    // Given
    const counter = new InMemoryCounterStore();
    const deferred = deferredStore(async () => counter, { increment: true, read: true });

    // When
    await deferred.increment(3);

    // Then
    expect(await deferred.read()).toBe(3);
  });
});
