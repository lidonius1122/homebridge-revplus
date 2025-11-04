import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { REVPlusPlatformConfig } from './settings';
export declare class REVPlusPlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly accessories: PlatformAccessory[];
    private wsClient;
    private availabilityAccessory;
    private alarmAccessory;
    readonly config: REVPlusPlatformConfig;
    constructor(log: Logger, config: PlatformConfig, api: API);
    configureAccessory(accessory: PlatformAccessory): void;
    discoverDevices(): void;
    private initializeAccessory;
    private setupWebSocket;
    shutdown(): void;
}
//# sourceMappingURL=platform.d.ts.map