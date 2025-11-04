"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlarmAccessory = void 0;
class AlarmAccessory {
    platform;
    accessory;
    service;
    isTriggered = false;
    resetTimer = null;
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'REV Plus')
            .setCharacteristic(this.platform.Characteristic.Model, 'Alarm Contact Sensor')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, 'REVPLUS-ALARM-001');
        this.service = this.accessory.getService(this.platform.Service.ContactSensor)
            || this.accessory.addService(this.platform.Service.ContactSensor);
        this.service.setCharacteristic(this.platform.Characteristic.Name, 'Einsatzalarm');
        this.service.getCharacteristic(this.platform.Characteristic.ContactSensorState)
            .onGet(this.handleContactSensorStateGet.bind(this));
        this.resetSensor();
    }
    handleContactSensorStateGet() {
        const state = this.isTriggered
            ? this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
            : this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED;
        this.platform.log.debug(`GET Contact Sensor State: ${this.isTriggered ? 'TRIGGERED' : 'NORMAL'}`);
        return state;
    }
    triggerAlarm(alert) {
        this.platform.log.info('Triggering alarm contact sensor');
        this.isTriggered = true;
        this.service.updateCharacteristic(this.platform.Characteristic.ContactSensorState, this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
        }
        const duration = this.platform.config.alarmDuration * 1000;
        this.platform.log.info(`Alarm sensor will auto-reset in ${this.platform.config.alarmDuration} seconds`);
        this.resetTimer = setTimeout(() => {
            this.resetSensor();
        }, duration);
    }
    resetSensor() {
        if (this.isTriggered) {
            this.platform.log.info('Resetting alarm contact sensor to normal state');
        }
        this.isTriggered = false;
        this.service.updateCharacteristic(this.platform.Characteristic.ContactSensorState, this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED);
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
            this.resetTimer = null;
        }
    }
    destroy() {
        if (this.resetTimer) {
            clearTimeout(this.resetTimer);
            this.resetTimer = null;
        }
    }
}
exports.AlarmAccessory = AlarmAccessory;
//# sourceMappingURL=alarmAccessory.js.map