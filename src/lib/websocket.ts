import { WS_BASE_URL } from './config';

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    image: string | null;
  };
  recipient?: {
    id: string;
    name: string;
    image: string | null;
  };
}

export interface ProposalUpdate {
  id: string;
  status: string;
  jobTitle: string;
}

type MessageHandler = (message: any) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private connectionTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPongTime: number = 0;

  constructor() {
    // Initialize handlers for different message types
    this.messageHandlers.set('CHAT_MESSAGE', new Set());
    this.messageHandlers.set('PROPOSAL_UPDATE', new Set());
    this.messageHandlers.set('ERROR', new Set());
    this.messageHandlers.set('CONNECTION_STATUS', new Set());
    this.messageHandlers.set('MESSAGE_SENT', new Set());
    this.messageHandlers.set('PONG', new Set());
  }

  connect() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token available');
      this.notifyError('No authentication token available');
      return;
    }

    // Check if WebSocket is already connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Check if WebSocket is in the process of connecting
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket connection in progress');
      return;
    }

    // Clear any existing intervals and timeouts
    this.cleanup();

    this.connectionStatus = 'connecting';
    this.notifyConnectionStatus();

    // Properly encode the token for the URL
    const encodedToken = encodeURIComponent(token);
    const wsUrl = `${WS_BASE_URL}?token=${encodedToken}`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      // Set a connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.error('WebSocket connection timeout');
          this.ws.close();
          this.notifyError('Connection timeout');
          this.attemptReconnect();
        }
      }, 10000); // 10 seconds timeout
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.notifyError('Failed to create WebSocket connection');
      this.attemptReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.connectionStatus = 'connected';
      this.notifyConnectionStatus();
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      // Start ping interval
      this.startPingInterval();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle PONG messages
        if (data.type === 'PONG') {
          this.lastPongTime = Date.now();
          return;
        }
        
        const handlers = this.messageHandlers.get(data.type);
        if (handlers) {
          handlers.forEach(handler => handler(data));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        this.notifyError('Error processing WebSocket message');
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.connectionStatus = 'disconnected';
      this.notifyConnectionStatus();
      this.cleanup();
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error occurred. WebSocket state:', this.ws?.readyState);
      
      if (error instanceof ErrorEvent) {
        console.error('WebSocket error details:', {
          message: error.message,
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
          error: error.error
        });
      } else {
        console.error('WebSocket error object:', {
          type: typeof error,
          properties: Object.keys(error || {}),
          error: error
        });
      }
      
      // Log the token (without the actual value) to help with debugging
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token, 'Token length:', token ? token.length : 0);
      
      this.connectionStatus = 'disconnected';
      this.notifyConnectionStatus();
      this.notifyError('WebSocket connection error');
      this.cleanup();
      this.attemptReconnect();
    };
  }

  private cleanup() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private startPingInterval() {
    this.lastPongTime = Date.now();
    
    // Send ping every 15 seconds
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Check if we haven't received a pong in 45 seconds
        if (Date.now() - this.lastPongTime > 45000) {
          console.error('No PONG received for 45 seconds, reconnecting...');
          this.ws.close();
          return;
        }
        
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 15000);
  }

  private notifyConnectionStatus() {
    const handlers = this.messageHandlers.get('CONNECTION_STATUS');
    if (handlers) {
      handlers.forEach(handler => handler({
        type: 'CONNECTION_STATUS',
        status: this.connectionStatus
      }));
    }
  }

  private notifyError(message: string) {
    const handlers = this.messageHandlers.get('ERROR');
    if (handlers) {
      handlers.forEach(handler => handler({
        type: 'ERROR',
        message
      }));
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.notifyError('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  disconnect() {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionStatus = 'disconnected';
    this.notifyConnectionStatus();
  }

  on(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.add(handler);
    } else {
      this.messageHandlers.set(type, new Set([handler]));
    }
  }

  off(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  sendChatMessage(recipientId: string, content: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      this.notifyError('WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'CHAT_MESSAGE',
      recipientId,
      content
    }));
  }

  sendProposalUpdate(proposalId: string, status: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      this.notifyError('WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'PROPOSAL_UPDATE',
      proposalId,
      status
    }));
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }
}

export default new WebSocketClient(); 