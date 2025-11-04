import { PlatformAccessory } from 'homebridge';
import { REVPlusPlatform } from './platform';
import { AlertMessage } from './settings';
export declare class AlarmAccessory {
    private readonly platform;
    private readonly accessory;
    private service;
    private isTriggered;
    private resetTimer;
    constructor(platform: REVPlusPlatform, accessory: PlatformAccessory);
    private handleContactSensorStateGet;
    triggerAlarm(alert: AlertMessage): void;
    private resetSensor;
    destroy(): void;
}
//# sourceMappingURL=alarmAccessory.d.ts.map