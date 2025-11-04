import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';
import { PLATFORM_NAME, PLUGIN_NAME, REVPlusPlatformConfig } from './settings';
import { REVPlusWebSocketClient } from './websocketClient';
import { AvailabilityAccessory } from './availabilityAccessory';
import { AlarmAccessory } from './alarmAccessory';

/**
 * REV Plus Platform
 * Manages the WebSocket connection and creates the two accessories:
 * 1. Availability Switch (shows if user is available/delayed available)
 * 2. Alarm Contact Sensor (triggers on alarm and auto-resets)
 */
export class REVPlusPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  // Cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  // WebSocket client
  private wsClient: REVPlusWebSocketClient | null = null;

  // Accessory handlers
  private availabilityAccessory: AvailabilityAccessory | null = null;
  private alarmAccessory: AlarmAccessory | null = null;

  // Typed config
  public readonly config: REVPlusPlatformConfig;

  constructor(
    public readonly log: Logger,
    config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;
    this.config = config as unknown as REVPlusPlatformConfig;

    // Validate configuration
    if (!this.config.accessToken) {
      this.log.error('Access token is required! Please configure the plugin in Homebridge Config UI.');
      return;
    }

    // Set default alarm duration if not specified
    if (!this.config.alarmDuration) {
      this.config.alarmDuration = 300; // 5 minutes default
    }

    this.log.info('REV Plus Platform finished initializing');

    // Wait for Homebridge to restore cached accessories
    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
      this.setupWebSocket();
    });
  }

  /**
   * Restore cached accessories from disk
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.push(accessory);
  }

  /**
   * Discover and register the two accessories
   */
  discoverDevices() {
    // Define the two accessories
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
      // Generate UUID
      const uuid = this.api.hap.uuid.generate(device.uniqueId);

      // Check if accessory already exists
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // Accessory already exists, restore it
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // Update accessory context
        existingAccessory.context.device = device;

        // Update reachability (always reachable in cloud-based plugin)
        this.api.updatePlatformAccessories([existingAccessory]);

        // Initialize the accessory handler
        this.initializeAccessory(existingAccessory, device.type);

      } else {
        // Create new accessory
        this.log.info('Adding new accessory:', device.displayName);

        const accessory = new this.api.platformAccessory(device.displayName, uuid);
        accessory.context.device = device;

        // Initialize the accessory handler
        this.initializeAccessory(accessory, device.type);

        // Register the accessory
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.accessories.push(accessory);
      }
    }

    // Remove any accessories that are no longer needed
    const validUUIDs = devices.map(device => this.api.hap.uuid.generate(device.uniqueId));
    const accessoriesToRemove = this.accessories.filter(accessory => !validUUIDs.includes(accessory.UUID));

    if (accessoriesToRemove.length > 0) {
      this.log.info('Removing obsolete accessories');
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, accessoriesToRemove);
    }
  }

  /**
   * Initialize the appropriate accessory handler
   */
  private initializeAccessory(accessory: PlatformAccessory, type: string) {
    if (type === 'availability') {
      this.availabilityAccessory = new AvailabilityAccessory(this, accessory);
    } else if (type === 'alarm') {
      this.alarmAccessory = new AlarmAccessory(this, accessory);
    }
  }

  /**
   * Setup WebSocket connection
   */
  private setupWebSocket() {
    this.log.info('Setting up WebSocket connection...');

    this.wsClient = new REVPlusWebSocketClient(
      this.config.accessToken,
      this.log,
      {
        onConnected: (user) => {
          this.log.info(`Successfully connected as: ${user}`);
        },

        onAlert: (alert) => {
          // Trigger the alarm contact sensor
          if (this.alarmAccessory) {
            this.alarmAccessory.triggerAlarm(alert);
          }
        },

        onAvailability: (availability) => {
          // Update the availability switch
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
      },
    );

    // Connect
    this.wsClient.connect();
  }

  /**
   * Cleanup on shutdown
   */
  public shutdown() {
    this.log.info('Shutting down REV Plus Platform...');

    if (this.wsClient) {
      this.wsClient.disconnect();
    }

    if (this.alarmAccessory) {
      this.alarmAccessory.destroy();
    }
  }
}
