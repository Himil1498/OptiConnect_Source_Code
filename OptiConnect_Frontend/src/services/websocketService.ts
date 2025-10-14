import { WS_URL } from '../utils/constants';

interface WebSocketMessage {
  type: string;
  event: string;
  data: any;
  timestamp: string;
  channel?: string;
}

interface WebSocketSubscription {
  id: string;
  channel: string;
  callback: (data: any) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private isAuthenticated = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionListeners: Array<(connected: boolean) => void> = [];

  constructor() {
    console.log('🔌 WebSocket Service initialized');
  }

  /**
   * Connect to WebSocket server with authentication
   */
  async connect(): Promise<boolean> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return true;
    }

    if (this.isConnecting) {
      return false;
    }

    try {
      this.isConnecting = true;
      console.log('🔄 Connecting to WebSocket server...');

      // Get current access token from advanced auth service
      const accessToken = sessionStorage.getItem('opti_access_token');
      if (!accessToken) {
        console.warn('⚠️ No access token available for WebSocket connection');
        return false;
      }

      // Create WebSocket connection with authentication
      const wsUrl = `${WS_URL}/ws?token=${encodeURIComponent(accessToken)}`;
      this.ws = new WebSocket(wsUrl);

      // Setup event handlers
      this.setupEventHandlers();

      // Wait for connection to establish
      await new Promise<void>((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('WebSocket creation failed'));
          return;
        }

        const connectionTimeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 10000); // 10 second timeout

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          resolve();
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          reject(error);
        };
      });

      this.isAuthenticated = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.notifyConnectionListeners(true);
      
      console.log('✅ WebSocket connected successfully');
      return true;

    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.handleConnectionError();
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.isAuthenticated = false;
    this.subscriptions.clear();
    this.notifyConnectionListeners(false);
    
    console.log('✅ WebSocket disconnected');
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('✅ WebSocket connection opened');
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason);
      this.handleConnectionClose(event.code);
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.handleConnectionError();
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('📨 WebSocket message received:', message);

    // Handle heartbeat/ping messages
    if (message.type === 'ping') {
      this.sendMessage({ type: 'pong', event: 'heartbeat', data: null, timestamp: new Date().toISOString() });
      return;
    }

    // Route message to subscribers
    if (message.channel) {
      this.subscriptions.forEach((subscription) => {
        if (subscription.channel === message.channel) {
          try {
            subscription.callback(message.data);
          } catch (error) {
            console.error('❌ Error in WebSocket subscription callback:', error);
          }
        }
      });
    }

    // Handle global messages
    this.handleGlobalMessages(message);
  }

  /**
   * Handle global system messages
   */
  private handleGlobalMessages(message: WebSocketMessage): void {
    switch (message.event) {
      case 'system_notification':
        console.log('🔔 System notification:', message.data);
        break;
      case 'user_session_expired':
        console.warn('⚠️ User session expired via WebSocket');
        // Notify advanced auth service about session expiry
        window.dispatchEvent(new CustomEvent('auth:session_expired', { detail: message.data }));
        break;
      case 'force_logout':
        console.warn('⚠️ Force logout received via WebSocket');
        window.dispatchEvent(new CustomEvent('auth:force_logout', { detail: message.data }));
        break;
      default:
        console.log('📨 Unhandled WebSocket message:', message);
    }
  }

  /**
   * Handle connection close
   */
  private handleConnectionClose(code: number): void {
    this.isAuthenticated = false;
    this.notifyConnectionListeners(false);

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Attempt reconnection for certain close codes
    if (code !== 1000 && code !== 1001 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.log('🔌 WebSocket connection permanently closed');
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(): void {
    this.isAuthenticated = false;
    this.notifyConnectionListeners(false);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts); // Exponential backoff
    this.reconnectAttempts++;

    console.log(`🔄 Scheduling WebSocket reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(async () => {
      if (!this.isConnected()) {
        await this.connect();
      }
    }, delay);
  }

  /**
   * Send message to WebSocket server
   */
  private sendMessage(message: WebSocketMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Cannot send WebSocket message - not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('❌ Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({
          type: 'ping',
          event: 'heartbeat',
          data: { timestamp: Date.now() },
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string, callback: (data: any) => void): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      channel,
      callback
    });

    // Send subscription request to server
    if (this.isConnected()) {
      this.sendMessage({
        type: 'subscribe',
        event: 'channel_subscription',
        data: { channel },
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔔 Subscribed to channel: ${channel} (${subscriptionId})`);
    return subscriptionId;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      // Send unsubscription request to server
      if (this.isConnected()) {
        this.sendMessage({
          type: 'unsubscribe',
          event: 'channel_unsubscription',
          data: { channel: subscription.channel },
          timestamp: new Date().toISOString()
        });
      }

      this.subscriptions.delete(subscriptionId);
      console.log(`🔕 Unsubscribed from channel: ${subscription.channel} (${subscriptionId})`);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated;
  }

  /**
   * Add connection status listener
   */
  addConnectionListener(callback: (connected: boolean) => void): void {
    this.connectionListeners.push(callback);
  }

  /**
   * Remove connection status listener
   */
  removeConnectionListener(callback: (connected: boolean) => void): void {
    const index = this.connectionListeners.indexOf(callback);
    if (index > -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  /**
   * Notify connection listeners
   */
  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('❌ Error in connection listener:', error);
      }
    });
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device info for connection
   */
  private getDeviceInfo(): string {
    return `${navigator.userAgent.substring(0, 100)} | ${new Date().toISOString()}`;
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Export for convenience
export default websocketService;