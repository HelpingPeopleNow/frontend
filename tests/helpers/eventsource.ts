type Listener = (e: MessageEvent) => void;

export class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  withCredentials: boolean | undefined;
  readyState = 0;

  private listeners: Record<string, Listener[]> = {};
  onopen: ((e: Event) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;

  constructor(url: string, opts?: { withCredentials?: boolean }) {
    this.url = url;
    this.withCredentials = opts?.withCredentials;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, cb: Listener) {
    (this.listeners[type] ||= []).push(cb);
  }

  removeEventListener(type: string, cb: Listener) {
    this.listeners[type] = (this.listeners[type] || []).filter(l => l !== cb);
  }

  close() {
    this.readyState = 2;
  }

  triggerOpen() {
    this.readyState = 1;
    this.onopen?.(new Event("open"));
  }

  triggerError() {
    this.onerror?.(new Event("error"));
  }

    triggerMessage(data: unknown) {
        const event = { data: JSON.stringify(data) } as MessageEvent;
        this.listeners["message"]?.forEach(l => l(event));
        this.onmessage?.(event);
    }

    triggerMessageRaw(rawData: string) {
        const event = { data: rawData } as MessageEvent;
        this.listeners["message"]?.forEach(l => l(event));
        this.onmessage?.(event);
    }

    triggerNamed(type: string, data: unknown) {
        const event = { data: JSON.stringify(data) } as MessageEvent;
        this.listeners[type]?.forEach(l => l(event));
    }

    triggerNamedRaw(type: string, rawData: string) {
        const event = { data: rawData } as MessageEvent;
        this.listeners[type]?.forEach(l => l(event));
    }

}
