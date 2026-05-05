class DerivAPI {
  private ws: WebSocket | null = null;
  private appId = process.env.NEXT_PUBLIC_DERIV_APP_ID;
  private callbacks: ((data: any) => void)[] = [];

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    
    this.ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${this.appId}`);
    
    this.ws.onopen = () => console.log('Deriv WebSocket Connected');

    this.ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      this.callbacks.forEach(cb => cb(data));
    };

    this.ws.onclose = () => {
      console.log('Deriv WebSocket Disconnected. Reconnecting in 5s...');
      setTimeout(() => this.connect(), 5000);
    };
  }

  subscribeTicks(symbol: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      setTimeout(() => this.subscribeTicks(symbol), 1000);
      return;
    }
    this.ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
  }

  onMessage(callback: (data: any) => void) {
    this.callbacks.push(callback);
  }
}

export const derivAPI = new DerivAPI();
