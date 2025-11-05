import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { REVPlusPlatform } from './platform';
import { AlertMessage } from './settings';

/**
 * Alarm Contact Sensor Accessory
 * Triggers on 'alert' messages and automatically resets after configured duration
 */
export class AlarmAccessory {
  private service: Service;
  private isTriggered = false;
  private resetTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly platform: REVPlusPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // Set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'REV Plus')
      .setCharacteristic(this.platform.Characteristic.Model, 'Alarm Contact Sensor')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'REVPLUS-ALARM-001');

    // Get or create the contact sensor service
    this.service = this.accessory.getService(this.platform.Service.ContactSensor)
      || this.accessory.addService(this.platform.Service.ContactSensor);

    this.service.setCharacteristic(this.platform.Characteristic.Name, 'Einsatzalarm');

    // Register handler for GET requests
    this.service.getCharacteristic(this.platform.Characteristic.ContactSensorState)
      .onGet(this.handleContactSensorStateGet.bind(this));

    // Initialize as not triggered
    this.resetSensor();
  }

  /**
   * Handle GET requests from HomeKit
   */
  private handleContactSensorStateGet(): CharacteristicValue {
    // ContactSensorState: 0 = CONTACT_DETECTED (closed/normal), 1 = CONTACT_NOT_DETECTED (open/triggered)
    const state = this.isTriggered
      ? this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
      : this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED;

    this.platform.log.debug(`GET Contact Sensor State: ${this.isTriggered ? 'TRIGGERED' : 'NORMAL'}`);
    return state;
  }

  /**
   * Trigger the alarm sensor when receiving an alert
   */
  public triggerAlarm(alert: AlertMessage): void {
    this.platform.log.info('AlarmAccessory.triggerAlarm called');
    this.platform.log.info('Alert einsatznummer:', alert.einsatznummer);

    // Set triggered state
    this.isTriggered = true;

    this.platform.log.info('Setting contact sensor to CONTACT_NOT_DETECTED (triggered)');

    // Update HomeKit characteristic (1 = open/triggered)
    this.service.updateCharacteristic(
      this.platform.Characteristic.ContactSensorState,
      this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED,
    );

    // Cancel any existing reset timer
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.platform.log.info('Cleared existing reset timer');
    }

    // Schedule automatic reset based on configured duration
    const duration = this.platform.config.alarmDuration * 1000; // Convert to milliseconds
    this.platform.log.info(`Alarm sensor will auto-reset in ${this.platform.config.alarmDuration} seconds`);

    this.resetTimer = setTimeout(() => {
      this.resetSensor();
    }, duration);

    this.platform.log.info('Alarm trigger complete');
  }

  /**
   * Reset the sensor to normal state
   */
  private resetSensor(): void {
    if (this.isTriggered) {
      this.platform.log.info('Resetting alarm contact sensor to normal state');
    }

    this.isTriggered = false;

    // Update HomeKit characteristic (0 = closed/normal)
    this.service.updateCharacteristic(
      this.platform.Characteristic.ContactSensorState,
      this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED,
    );

    // Clear timer if exists
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Cleanup method called when accessory is being removed
   */
  public destroy(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }
}
