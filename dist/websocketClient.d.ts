import { Logger } from 'homebridge';
import { AlertMessage, AvailabilityMessage } from './settings';
export interface WebSocketEventHandlers {
    onConnected?: (user: string) => void;
    onAlert?: (alert: AlertMessage) => void;
    onAvailability?: (availability: AvailabilityMessage) => void;
    onError?: (error: Error) => void;
    onClose?: () => void;
}
export declare class REVPlusWebSocketClient {
    private readonly accessToken;
    private readonly log;
    private readonly handlers;
    private ws;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectTimeout;
    private isIntentionallyClosed;
    constructor(accessToken: string, log: Logger, handlers: WebSocketEventHandlers);
    connect(): void;
    disconnect(): void;
    private handleMessage;
    private handleConnected;
    private handleAlert;
    private handleAvailability;
    private scheduleReconnect;
}
//# sourceMappingURL=websocketClient.d.ts.map