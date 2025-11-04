"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REVPlusPlatform = void 0;
const settings_1 = require("./settings");
const websocketClient_1 = require("./websocketClient");
const availabilityAccessory_1 = require("./availabilityAccessory");
const alarmAccessory_1 = require("./alarmAccessory");
class REVPlusPlatform {
    log;
    api;
    Service;
    Characteristic;
    accessories = [];
    wsClient = null;
    availabilityAccessory = null;
    alarmAccessory = null;
    config;
    constructor(log, config, api) {
        this.log = log;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        this.config = config;
        if (!this.config.accessToken) {
            this.log.error('Access token is required! Please configure the plugin in Homebridge Config UI.');
            return;
        }
        if (!this.config.alarmDuration) {
            this.config.alarmDuration = 300;
        }
        this.log.info('REV Plus Platform finished initializing');
        this.api.on('didFinishLaunching', () => {
            this.log.debug('Executed didFinishLaunching callback');
            this.discoverDevices();
            this.setupWebSocket();
        });
    }
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        this.accessories.push(accessory);
    }
    discoverDevices() {
        const devices = [
            {
                uniqueId: 'revplus-availability',
                displayName: 'REV Plus Verfügbarkeit',
                type: 'availability',
            },
            {
                uniqueId: 'revplus-alarm',
                displayName: 'REV Plus Einsatzalarm',
                type: 'alarm',
            },
        ];
        for (const device of devices) {
            const uuid = this.api.hap.uuid.generate(device.uniqueId);
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
            if (existingAccessory) {
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
                existingAccessory.context.device = device;
                this.api.updatePlatformAccessories([existingAccessory]);
                this.initializeAccessory(existingAccessory, device.type);
            }
            else {
                this.log.info('Adding new accessory:', device.displayName);
                const accessory = new this.api.platformAccessory(device.displayName, uuid);
                accessory.context.device = device;
                this.initializeAccessory(accessory, device.type);
                this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
                this.accessories.push(accessory);
            }
        }
        const validUUIDs = devices.map(device => this.api.hap.uuid.generate(device.uniqueId));
        const accessoriesToRemove = this.accessories.filter(accessory => !validUUIDs.includes(accessory.UUID));
        if (accessoriesToRemove.length > 0) {
            this.log.info('Removing obsolete accessories');
            this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, accessoriesToRemove);
        }
    }
    initializeAccessory(accessory, type) {
        if (type === 'availability') {
            this.availabilityAccessory = new availabilityAccessory_1.AvailabilityAccessory(this, accessory);
        }
        else if (type === 'alarm') {
            this.alarmAccessory = new alarmAccessory_1.AlarmAccessory(this, accessory);
        }
    }
    setupWebSocket() {
        this.log.info('Setting up WebSocket connection...');
        this.wsClient = new websocketClient_1.REVPlusWebSocketClient(this.config.accessToken, this.log, {
            onConnected: (user) => {
                this.log.info(`Successfully connected as: ${user}`);
            },
            onAlert: (alert) => {
                if (this.alarmAccessory) {
                    this.alarmAccessory.triggerAlarm(alert);
                }
            },
            onAvailability: (availability) => {
                if (this.availabilityAccessory) {
                    this.availabilityAccessory.updateStatus(availability);
                }
            },
            onError: (error) => {
                this.log.error('WebSocket error:', error.message);
            },
            onClose: () => {
                this.log.warn('WebSocket connection closed, will attempt to reconnect...');
            },
        });
        this.wsClient.connect();
    }
    shutdown() {
        this.log.info('Shutting down REV Plus Platform...');
        if (this.wsClient) {
            this.wsClient.disconnect();
        }
        if (this.alarmAccessory) {
            this.alarmAccessory.destroy();
        }
    }
}
exports.REVPlusPlatform = REVPlusPlatform;
//# sourceMappingURL=platform.js.map