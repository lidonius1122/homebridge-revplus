"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityAccessory = void 0;
const settings_1 = require("./settings");
class AvailabilityAccessory {
    platform;
    accessory;
    service;
    currentStatus = settings_1.AvailabilityStatus.NotAvailable;
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        this.accessory.getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'REV Plus')
            .setCharacteristic(this.platform.Characteristic.Model, 'Availability Switch')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, 'REVPLUS-AVAIL-001');
        this.service = this.accessory.getService(this.platform.Service.Switch)
            || this.accessory.addService(this.platform.Service.Switch);
        this.service.setCharacteristic(this.platform.Characteristic.Name, 'Verfügbarkeit');
        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onGet(this.handleOnGet.bind(this));
        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.handleOnSet.bind(this));
        this.restoreStatus();
    }
    handleOnGet() {
        const isOn = this.isAvailable(this.currentStatus);
        this.platform.log.debug(`GET Availability Status: ${isOn ? 'ON' : 'OFF'} (status: ${this.currentStatus})`);
        return isOn;
    }
    async handleOnSet(value) {
        this.platform.log.warn('Availability switch is read-only. Status can only be changed in the REV Plus app.');
        setTimeout(() => {
            const isOn = this.isAvailable(this.currentStatus);
            this.service.updateCharacteristic(this.platform.Characteristic.On, isOn);
        }, 500);
    }
    updateStatus(availability) {
        this.platform.log.info('AvailabilityAccessory.updateStatus called with:', JSON.stringify(availability));
        this.currentStatus = availability.availability;
        const isOn = this.isAvailable(this.currentStatus);
        this.platform.log.info(`Updating availability switch: ${isOn ? 'ON' : 'OFF'} (status: ${this.currentStatus})`);
        this.service.updateCharacteristic(this.platform.Characteristic.On, isOn);
        this.saveStatus();
        this.platform.log.info('Availability status update complete');
    }
    isAvailable(status) {
        return status === settings_1.AvailabilityStatus.Available || status === settings_1.AvailabilityStatus.DelayedAvailable;
    }
    saveStatus() {
        this.accessory.context.availabilityStatus = this.currentStatus;
    }
    restoreStatus() {
        if (this.accessory.context.availabilityStatus !== undefined) {
            this.currentStatus = this.accessory.context.availabilityStatus;
            const isOn = this.isAvailable(this.currentStatus);
            this.platform.log.info(`Restored availability status: ${isOn ? 'ON' : 'OFF'} (status: ${this.currentStatus})`);
            this.service.updateCharacteristic(this.platform.Characteristic.On, isOn);
        }
        else {
            this.platform.log.info('No previous availability status found, defaulting to OFF');
            this.currentStatus = settings_1.AvailabilityStatus.NotAvailable;
            this.service.updateCharacteristic(this.platform.Characteristic.On, false);
        }
    }
}
exports.AvailabilityAccessory = AvailabilityAccessory;
//# sourceMappingURL=availabilityAccessory.js.map