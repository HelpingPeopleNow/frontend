export interface SSEEvent {
  type: 'message' | 'read' | 'open' | 'archive' | 'block' | 'report';
  data: any;
}

type EventCallback = (e: SSEEvent) => void;

const SSE_URL = '/api/v1/direct-messages/stream';
const POLL_URL = '/api/v1/direct-messages/since';
const MAX_RECONNECT_MS = 30000;
const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = POLL_INTERVAL_MS * 2;

export class DirectMessageSSE {
  private es: EventSource | null = null;
  private reconnectAttempts = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSeen = new Date().toISOString();
  private callback: EventCallback | null = null;
  private running = false;

  connect(onEvent: EventCallback) {
    this.callback = onEvent;
    this.running = true;

    if (typeof EventSource === 'undefined') {
      console.log('[SSE] EventSource not available, starting polling');
      this.startPolling();
      return;
    }

    this.openSSE();
  }

  disconnect() {
    this.running = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.es?.close();
    this.es = null;
    this.stopPolling();
  }

  private stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private safeParse(raw: string): any | undefined {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[SSE] dropping malformed frame:', e);
      return undefined;
    }
  }

  private openSSE() {
    if (!this.running || !this.callback) return;

    this.stopPolling();

    this.es = new EventSource(SSE_URL, { withCredentials: true });

    this.es.addEventListener('message', (e: MessageEvent) => {
      this.lastSeen = new Date().toISOString();
      const data = this.safeParse(e.data);
      if (data !== undefined) this.callback?.({ type: 'message', data });
    });

    this.es.addEventListener('read', (e: MessageEvent) => {
      const data = this.safeParse(e.data);
      if (data !== undefined) this.callback?.({ type: 'read', data });
    });

    this.es.addEventListener('archive', (e: MessageEvent) => {
      const data = this.safeParse(e.data);
      if (data !== undefined) this.callback?.({ type: 'archive', data });
    });

    this.es.addEventListener('block', (e: MessageEvent) => {
      const data = this.safeParse(e.data);
      if (data !== undefined) this.callback?.({ type: 'block', data });
    });

    this.es.addEventListener('report', (e: MessageEvent) => {
      const data = this.safeParse(e.data);
      if (data !== undefined) this.callback?.({ type: 'report', data });
    });

    this.es.onopen = () => {
      this.reconnectAttempts = 0;
      this.stopPolling();
      this.callback?.({ type: 'open', data: {} });
      console.log('[SSE] connected');
    };

    this.es.onerror = () => {
      this.es?.close();
      this.es = null;

      if (!this.running) return;

      this.reconnectAttempts++;
      const delay = Math.min(MAX_RECONNECT_MS, 1000 * Math.pow(2, this.reconnectAttempts));
      console.log(`[SSE] reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.openSSE(), delay);

      if (this.reconnectAttempts > 3) {
        console.log('[SSE] switching to polling fallback');
        this.startPolling();
      }
    };
  }

  private async startPolling() {
    if (!this.running || !this.callback) return;

    if (this.pollTimer) return;

    const poll = async () => {
      if (!this.running) return;
      try {
        const res = await fetch(`${POLL_URL}?ts=${encodeURIComponent(this.lastSeen)}`, {
          credentials: 'include',
          signal: AbortSignal.timeout(POLL_TIMEOUT_MS),
        });
        if (res.ok) {
          const data = await res.json();
          this.lastSeen = data.server_time || new Date().toISOString();
          for (const msg of data.messages || []) {
            if (this.running) this.callback?.({ type: 'message', data: msg });
          }
        }
      } catch {
        // silent retry
      }
    };

    poll();
    this.pollTimer = setInterval(poll, POLL_INTERVAL_MS);
  }
}
