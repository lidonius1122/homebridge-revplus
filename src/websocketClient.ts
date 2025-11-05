import WebSocket from 'ws';
import { Logger } from 'homebridge';
import { WS_API_URL, WSMessage, MessageType, AlertMessage, AvailabilityMessage } from './settings';

/**
 * Event handlers for WebSocket messages
 */
export interface WebSocketEventHandlers {
  onConnected?: (user: string) => void;
  onAlert?: (alert: AlertMessage) => void;
  onAvailability?: (availability: AvailabilityMessage) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

/**
 * WebSocket client for REV Plus Alarm API
 */
export class REVPlusWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;

  constructor(
    private readonly accessToken: string,
    private readonly log: Logger,
    private readonly handlers: WebSocketEventHandlers,
  ) {}

  /**
   * Connect to the WebSocket API
   */
  public connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.log.debug('WebSocket already connected');
      return;
    }

    this.isIntentionallyClosed = false;
    // URL-encode the access token to handle special characters like / and +
    const encodedToken = encodeURIComponent(this.accessToken);
    const url = `${WS_API_URL}?AccessToken=${encodedToken}`;

    this.log.info('Connecting to REV Plus WebSocket API...');
    this.log.debug(`WebSocket URL: ${WS_API_URL}`);
    this.log.debug(`Access Token length: ${this.accessToken.length} characters`);
    this.log.debug(`Access Token starts with: ${this.accessToken.substring(0, 10)}...`);
    this.log.debug(`Token is URL-encoded for WebSocket connection`);

    try {
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.log.info('WebSocket connection established');
        this.reconnectAttempts = 0;
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const rawMessage = data.toString();
          this.log.info('━━━━━━━ RAW WEBSOCKET MESSAGE ━━━━━━━');
          this.log.info(rawMessage);
          this.log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          const message: WSMessage = JSON.parse(rawMessage);
          this.log.info(`Parsed message type: ${message.type}`);

          this.handleMessage(message);
        } catch (error) {
          this.log.error('Failed to parse WebSocket message:', error);
          this.log.error('Raw data:', data.toString());
        }
      });

      this.ws.on('error', (error: Error) => {
        this.log.error('━━━━━━━ WEBSOCKET ERROR ━━━━━━━');
        this.log.error('Error message:', error.message);
        this.log.error('Error details:', JSON.stringify(error, null, 2));
        this.log.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        if (this.handlers.onError) {
          this.handlers.onError(error);
        }
      });

      this.ws.on('close', () => {
        this.log.warn('WebSocket connection closed');
        if (this.handlers.onClose) {
          this.handlers.onClose();
        }

        // Attempt to reconnect unless intentionally closed
        if (!this.isIntentionallyClosed) {
          this.scheduleReconnect();
        }
      });

    } catch (error) {
      this.log.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket API
   */
  public disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.log.info('WebSocket disconnected');
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WSMessage): void {
    this.log.info(`Processing message type: ${message.type}`);

    switch (message.type) {
      case MessageType.Connected:
        this.handleConnected(message.message as any);
        break;

      case MessageType.Alert:
        this.log.info('Alert message detected, calling handler...');
        this.handleAlert(message.message as AlertMessage);
        break;

      case MessageType.Update:
        // We ignore updates as per user requirements
        this.log.info('Received update message (ignored as per requirements)');
        break;

      case MessageType.Availability:
        this.log.info('Availability message detected, calling handler...');
        this.handleAvailability(message.message as AvailabilityMessage);
        break;

      default:
        this.log.warn(`Unknown message type: ${message.type}`);
        this.log.warn(`Full message: ${JSON.stringify(message)}`);
    }
  }

  /**
   * Handle connected message
   */
  private handleConnected(message: { user: string; message: string }): void {
    this.log.info(`Connected as: ${message.user}`);
    if (this.handlers.onConnected) {
      this.handlers.onConnected(message.user);
    }
  }

  /**
   * Handle alert message
   */
  private handleAlert(alert: AlertMessage): void {
    this.log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    this.log.info('ALARM RECEIVED');
    this.log.info(`Einsatznummer: ${alert.einsatznummer}`);
    this.log.info(`Stichwort: ${alert.stichwort.gruppe} - ${alert.stichwort.stichwort}`);
    this.log.info(`Meldung: ${alert.stichwort.meldung}`);

    const address = `${alert.einsatzort.strasse} ${alert.einsatzort.hnr}, ${alert.einsatzort.plz} ${alert.einsatzort.stadt}`;
    this.log.info(`Adresse: ${address}`);

    if (alert.einsatzort.objekt?.name) {
      this.log.info(`Objekt: ${alert.einsatzort.objekt.name}`);
    }

    if (alert.myGroups.length > 0) {
      this.log.info(`Deine Gruppen: ${alert.myGroups.join(', ')}`);
    }

    this.log.info(`Priorität: ${alert.properties.prio} | SOSI: ${alert.properties.sosi ? 'Ja' : 'Nein'}`);
    this.log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (this.handlers.onAlert) {
      this.log.info('Calling onAlert handler...');
      this.handlers.onAlert(alert);
    } else {
      this.log.warn('No onAlert handler registered!');
    }
  }

  /**
   * Handle availability message
   */
  private handleAvailability(availability: AvailabilityMessage): void {
    const statusNames = [
      'Verfügbar',
      'Verspätet verfügbar',
      'Nicht verfügbar',
      'Dauerhaft nicht verfügbar',
      'Urlaub',
      'Krank',
      'Quarantäne',
    ];

    const statusName = statusNames[availability.availability] || 'Unbekannt';
    this.log.info(`Verfügbarkeitsstatus geändert: ${statusName} (${availability.availability})`);

    if (this.handlers.onAvailability) {
      this.log.info('Calling onAvailability handler...');
      this.handlers.onAvailability(availability);
    } else {
      this.log.warn('No onAvailability handler registered!');
    }
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      return;
    }

    this.reconnectAttempts++;

    // Exponential backoff: 2^attempts seconds, max 60 seconds
    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 60000);

    this.log.warn(`Attempting to reconnect in ${delay / 1000} seconds (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
}
