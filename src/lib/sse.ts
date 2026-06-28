export interface SSEEvent {
  type: 'message' | 'read' | 'open';
  data: any;
}

type EventCallback = (e: SSEEvent) => void;

const SSE_URL = '/api/v1/direct-messages/stream';
const POLL_URL = '/api/v1/direct-messages/since';
const MAX_RECONNECT_MS = 30000;
const POLL_INTERVAL_MS = 4000;

export class DirectMessageSSE {
  private es: EventSource | null = null;
  private reconnectAttempts = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
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

  private openSSE() {
    if (!this.running || !this.callback) return;

    this.es = new EventSource(SSE_URL, { withCredentials: true });

    this.es.addEventListener('message', (e: MessageEvent) => {
      this.lastSeen = new Date().toISOString();
      this.callback?.({ type: 'message', data: JSON.parse(e.data) });
    });

    this.es.addEventListener('read', (e: MessageEvent) => {
      this.callback?.({ type: 'read', data: JSON.parse(e.data) });
    });

    // Heartbeat also signals connection is alive
    this.es.addEventListener('heartbeat', () => {
      this.callback?.({ type: 'open', data: {} });
    });

    this.es.onopen = () => {
      this.reconnectAttempts = 0;
      console.log('[SSE] connected');
    };

    this.es.onerror = () => {
      this.es?.close();
      this.es = null;

      if (!this.running) return;

      this.reconnectAttempts++;
      const delay = Math.min(MAX_RECONNECT_MS, 1000 * Math.pow(2, this.reconnectAttempts));
      console.log(`[SSE] reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

      setTimeout(() => this.openSSE(), delay);

      // Fall back to polling after 3+ failed SSE attempts
      if (this.reconnectAttempts > 3) {
        console.log('[SSE] switching to polling fallback');
        this.startPolling();
      }
    };
  }

  private async startPolling() {
    if (!this.running || !this.callback) return;

    // Don't start a second polling timer
    if (this.pollTimer) return;

    const poll = async () => {
      if (!this.running) return;
      try {
        const res = await fetch(`${POLL_URL}?ts=${encodeURIComponent(this.lastSeen)}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          this.lastSeen = data.server_time || new Date().toISOString();
          for (const msg of data.messages || []) {
            this.callback?.({ type: 'message', data: msg });
          }
        }
      } catch {
        // silent retry
      }
    };

    // Poll immediately, then on interval
    poll();
    this.pollTimer = setInterval(poll, POLL_INTERVAL_MS);
  }
}
