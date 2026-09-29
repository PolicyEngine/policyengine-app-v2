import { vi } from 'vitest';
import type { SearchWorkerResponse } from '@/libs/parameterSearch.worker';

export class MockSearchWorker {
  static instances: MockSearchWorker[] = [];
  onmessage: ((event: MessageEvent<SearchWorkerResponse>) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    MockSearchWorker.instances.push(this);
  }
  reply(data: SearchWorkerResponse) {
    this.onmessage?.({ data } as MessageEvent<SearchWorkerResponse>);
  }
}
