import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { REVPlusPlatform } from './platform';
import { AvailabilityStatus, AvailabilityMessage } from './settings';

/**
 * Availability Switch Accessory
 * Shows switch as ON when status is "Available" (0) or "Delayed Available" (1)
 * Shows switch as OFF for all other statuses (2-6)
 */
export class AvailabilityAccessory {
  private service: Service;
  private currentStatus: AvailabilityStatus = AvailabilityStatus.NotAvailable;

  constructor(
    private readonly platform: REVPlusPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // Set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'REV Plus')
      .setCharacteristic(this.platform.Characteristic.Model, 'Availability Switch')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'REVPLUS-AVAIL-001');

    // Get or create the switch service
    this.service = this.accessory.getService(this.platform.Service.Switch)
      || this.accessory.addService(this.platform.Service.Switch);

    this.service.setCharacteristic(this.platform.Characteristic.Name, 'Verfügbarkeit');

    // Register handler for GET requests
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.handleOnGet.bind(this));

    // Switch is read-only from HomeKit perspective (controlled by REV Plus app)
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.handleOnSet.bind(this));

    // Restore last known status from persistent storage
    this.restoreStatus();
  }

  /**
   * Handle GET requests from HomeKit
   */
  private handleOnGet(): CharacteristicValue {
    const isOn = this.isAvailable(this.currentStatus);
    this.platform.log.debug(`GET Availability Status: ${isOn ? 'ON' : 'OFF'} (status: ${this.currentStatus})`);
    return isOn;
  }

  /**
   * Handle SET requests from HomeKit (read-only, so we just log and restore)
   */
  private async handleOnSet(value: CharacteristicValue) {
    this.platform.log.warn('Availability switch is read-only. Status can only be changed in the REV Plus app.');

    // Restore the actual status after a short delay
    setTimeout(() => {
      const isOn = this.isAvailable(this.currentStatus);
      this.service.updateCharacteristic(this.platform.Characteristic.On, isOn);
    }, 500);
  }

  /**
   * Update the availability status from WebSocket message
   */
  public updateStatus(availability: AvailabilityMessage): void {
    this.platform.log.info('AvailabilityAccessory.updateStatus called with:', JSON.stringify(availability));

    this.currentStatus = availability.availability;
    const isOn = this.isAvailable(this.currentStatus);

    this.platform.log.info(`Updating availability switch: ${isOn ? 'ON' : 'OFF'} (status: ${this.currentStatus})`);

    // Update HomeKit characteristic
    this.service.updateCharacteristic(this.platform.Characteristic.On, isOn);

    // Save to persistent storage
    this.saveStatus();

    this.platform.log.info('Availability status update complete');
  }

  /**
   * Check if status means "available"
   * Returns true for Available (0) and DelayedAvailable (1)
   */
  private isAvailable(status: AvailabilityStatus): boolean {
    return status === AvailabilityStatus.Available || status === AvailabilityStatus.DelayedAvailable;
  }

  /**
   * Save current status to persistent storage
   */
  private saveStatus(): void {
    this.accessory.context.availabilityStatus = this.currentStatus;
  }

  /**
   * Restore status from persistent storage
   */
  private restoreStatus(): void {
    if (this.accessory.context.availabilityStatus !== undefined) {
      this.currentStatus = this.accessory.context.availabilityStatus;
      const isOn = this.isAvailable(this.currentStatus);

      this.platform.log.info(`Restored availability status: ${isOn ? 'ON' : 'OFF'} (status: ${this.currentStatus})`);

      // Update the switch state
      this.service.updateCharacteristic(this.platform.Characteristic.On, isOn);
    } else {
      // Default to NOT AVAILABLE on first run
      this.platform.log.info('No previous availability status found, defaulting to OFF');
      this.currentStatus = AvailabilityStatus.NotAvailable;
      this.service.updateCharacteristic(this.platform.Characteristic.On, false);
    }
  }
}
