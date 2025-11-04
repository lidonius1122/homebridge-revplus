export interface REVPlusPlatformConfig {
    name: string;
    accessToken: string;
    alarmDuration: number;
}
export declare const PLATFORM_NAME = "REVPlusAlarm";
export declare const PLUGIN_NAME = "homebridge-revplus";
export declare const WS_API_URL = "wss://broker.einsatzverwaltung.de/alarm";
export declare enum AvailabilityStatus {
    Available = 0,
    DelayedAvailable = 1,
    NotAvailable = 2,
    PermanentlyNotAvailable = 3,
    Vacation = 4,
    Sick = 5,
    Quarantine = 6
}
export declare enum MessageType {
    Connected = "connected",
    Alert = "alert",
    Update = "update",
    Availability = "availability"
}
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
//# sourceMappingURL=settings.d.ts.map