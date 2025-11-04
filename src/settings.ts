/**
 * Platform configuration interface
 */
export interface REVPlusPlatformConfig {
  name: string;
  accessToken: string;
  alarmDuration: number;
}

/**
 * Platform constants
 */
export const PLATFORM_NAME = 'REVPlusAlarm';
export const PLUGIN_NAME = 'homebridge-revplus';

/**
 * WebSocket API URL
 */
export const WS_API_URL = 'wss://broker.einsatzverwaltung.de/alarm';

/**
 * Availability status enum based on REV Plus API
 */
export enum AvailabilityStatus {
  Available = 0,              // Verfügbar
  DelayedAvailable = 1,       // Verspätet verfügbar
  NotAvailable = 2,           // Nicht verfügbar
  PermanentlyNotAvailable = 3,// Dauerhaft nicht verfügbar
  Vacation = 4,               // Urlaub
  Sick = 5,                   // Krank
  Quarantine = 6,             // Quarantäne
}

/**
 * WebSocket message types
 */
export enum MessageType {
  Connected = 'connected',
  Alert = 'alert',
  Update = 'update',
  Availability = 'availability',
}

/**
 * REV Plus WebSocket message interfaces
 */

export interface WSMessage {
  type: MessageType;
  message: ConnectedMessage | AlertMessage | AvailabilityMessage;
}

export interface ConnectedMessage {
  message: string;
  user: string;
}

export interface AlertMessage {
  alertId: string;
  alarmLevel: number;
  groups: string[];
  myGroups: string[];
  properties: {
    kwk: boolean;
    abbruch: boolean;
    sosi: boolean;
    prio: number;
  };
  stichwort: {
    eart: string;
    indikation: string;
    gruppe: string;
    stichwort: string;
    diagnose: string | null;
    meldung: string;
  };
  einsatzort: {
    strasse: string;
    hnr: string;
    plz: string;
    stadt: string;
    stadtteil: string;
    objekt: {
      name: string;
    } | null;
  };
  bemerkung: string;
  einsatznummer: string;
}

export interface AvailabilityMessage {
  availability: AvailabilityStatus;
  organization: string;
}
