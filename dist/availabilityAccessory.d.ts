import { PlatformAccessory } from 'homebridge';
import { REVPlusPlatform } from './platform';
import { AvailabilityMessage } from './settings';
export declare class AvailabilityAccessory {
    private readonly platform;
    private readonly accessory;
    private service;
    private currentStatus;
    constructor(platform: REVPlusPlatform, accessory: PlatformAccessory);
    private handleOnGet;
    private handleOnSet;
    updateStatus(availability: AvailabilityMessage): void;
    private isAvailable;
    private saveStatus;
    private restoreStatus;
}
//# sourceMappingURL=availabilityAccessory.d.ts.map