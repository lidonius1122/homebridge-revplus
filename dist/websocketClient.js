"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REVPlusWebSocketClient = void 0;
const ws_1 = __importDefault(require("ws"));
const settings_1 = require("./settings");
class REVPlusWebSocketClient {
    accessToken;
    log;
    handlers;
    ws = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 10;
    reconnectTimeout = null;
    isIntentionallyClosed = false;
    constructor(accessToken, log, handlers) {
        this.accessToken = accessToken;
        this.log = log;
        this.handlers = handlers;
    }
    connect() {
        if (this.ws && this.ws.readyState === ws_1.default.OPEN) {
            this.log.debug('WebSocket already connected');
            return;
        }
        this.isIntentionallyClosed = false;
        const url = `${settings_1.WS_API_URL}?AccessToken=${this.accessToken}`;
        this.log.info('Connecting to REV Plus WebSocket API...');
        try {
            this.ws = new ws_1.default(url);
            this.ws.on('open', () => {
                this.log.info('WebSocket connection established');
                this.reconnectAttempts = 0;
            });
            this.ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(message);
                }
                catch (error) {
                    this.log.error('Failed to parse WebSocket message:', error);
                }
            });
            this.ws.on('error', (error) => {
                this.log.error('WebSocket error:', error.message);
                if (this.handlers.onError) {
                    this.handlers.onError(error);
                }
            });
            this.ws.on('close', () => {
                this.log.warn('WebSocket connection closed');
                if (this.handlers.onClose) {
                    this.handlers.onClose();
                }
                if (!this.isIntentionallyClosed) {
                    this.scheduleReconnect();
                }
            });
        }
        catch (error) {
            this.log.error('Failed to create WebSocket connection:', error);
            this.scheduleReconnect();
        }
    }
    disconnect() {
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
    handleMessage(message) {
        this.log.debug(`Received message type: ${message.type}`);
        switch (message.type) {
            case settings_1.MessageType.Connected:
                this.handleConnected(message.message);
                break;
            case settings_1.MessageType.Alert:
                this.handleAlert(message.message);
                break;
            case settings_1.MessageType.Update:
                this.log.debug('Received update message (ignored)');
                break;
            case settings_1.MessageType.Availability:
                this.handleAvailability(message.message);
                break;
            default:
                this.log.warn(`Unknown message type: ${message.type}`);
        }
    }
    handleConnected(message) {
        this.log.info(`Connected as: ${message.user}`);
        if (this.handlers.onConnected) {
            this.handlers.onConnected(message.user);
        }
    }
    handleAlert(alert) {
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
            this.handlers.onAlert(alert);
        }
    }
    handleAvailability(availability) {
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
            this.handlers.onAvailability(availability);
        }
    }
    scheduleReconnect() {
        if (this.isIntentionallyClosed) {
            return;
        }
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.log.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
            return;
        }
        this.reconnectAttempts++;
        const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 60000);
        this.log.warn(`Attempting to reconnect in ${delay / 1000} seconds (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, delay);
    }
}
exports.REVPlusWebSocketClient = REVPlusWebSocketClient;
//# sourceMappingURL=websocketClient.js.map