# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Homebridge plugin for REV Plus fire department alarm integration. Connects to the REV Plus WebSocket API to expose two HomeKit accessories:
1. **Availability Switch** - Read-only switch showing user's REV Plus availability status (on = available/delayed, off = unavailable/vacation/sick/quarantine)
2. **Alarm Contact Sensor** - Triggers when an emergency alarm is received, auto-resets after configurable duration

## Development Commands

### Build and Development
```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Watch mode - auto-rebuild, link locally, and restart on changes
npm run watch

# Link plugin locally for testing with Homebridge
npm link
```

### Testing Installation
After building and linking locally, restart Homebridge to test changes:
```bash
# Systemd (most common)
sudo systemctl restart homebridge

# Docker
docker restart homebridge
```

### Viewing Logs
```bash
# Follow Homebridge logs to see plugin output
sudo journalctl -u homebridge -f

# Or check logs in Homebridge Config UI under "Logs" section
```

## Architecture

### Entry Point and Platform Lifecycle
- `src/index.ts` - Plugin registration entry point, exports platform class to Homebridge
- `src/platform.ts` - Main `REVPlusPlatform` class implementing `DynamicPlatformPlugin`
  - Initializes on Homebridge startup
  - Validates config and sets defaults (alarmDuration: 300 seconds)
  - On `didFinishLaunching`: discovers/restores accessories and establishes WebSocket connection
  - Manages two accessory instances and WebSocket client lifetime

### WebSocket Client Architecture
- `src/websocketClient.ts` - `REVPlusWebSocketClient` handles persistent connection to REV Plus WebSocket API
  - Connects to `wss://broker.einsatzverwaltung.de/alarm?AccessToken={token}`
  - Event-driven architecture with handlers for: connected, alert, availability, error, close
  - Automatic reconnection with exponential backoff (max 10 attempts, up to 60s delay)
  - Message types: `connected`, `alert`, `update` (ignored), `availability`
  - Platform subscribes to events and delegates to appropriate accessory handlers

### Accessory Handlers
- `src/availabilityAccessory.ts` - `AvailabilityAccessory` manages the availability switch
  - Exposes HomeKit `Switch` service (read-only, no set handler)
  - Maps REV Plus status codes to on/off: 0-1 = on (available/delayed), 2-6 = off (unavailable/vacation/sick/quarantine)
  - Persists last known status in accessory context (API doesn't send initial status on connect)
  - Status only updates when changed in REV Plus app

- `src/alarmAccessory.ts` - `AlarmAccessory` manages the alarm contact sensor
  - Exposes HomeKit `ContactSensor` service
  - On alarm: sets contact state to `CONTACT_NOT_DETECTED` (open/triggered)
  - Auto-resets to `CONTACT_DETECTED` (closed) after `config.alarmDuration` seconds
  - Logs detailed alarm information: einsatznummer, stichwort, address, groups, priority, SOSI flag

### Configuration and Types
- `src/settings.ts` - Core configuration, constants, and TypeScript interfaces
  - Platform config: `REVPlusPlatformConfig` (name, accessToken, alarmDuration)
  - Constants: `PLATFORM_NAME`, `PLUGIN_NAME`, `WS_API_URL`
  - Enums: `AvailabilityStatus` (0-6 status codes), `MessageType`
  - WebSocket message interfaces: `AlertMessage`, `AvailabilityMessage`, `ConnectedMessage`

### Key Design Patterns
- Platform creates and owns accessory instances, passing itself as dependency
- WebSocket client is callback-driven, platform acts as coordinator between WS and accessories
- Accessories are stateless except for persisted availability status
- Each accessory manages its own HomeKit service and characteristics
- Alarm accessory manages auto-reset timer internally, cleans up on destroy

## Configuration

Platform is configured in Homebridge `config.json` under `platforms` array:
```json
{
  "platform": "REVPlusAlarm",
  "name": "REV Plus Alarm",
  "accessToken": "YOUR_REVPLUS_TOKEN",
  "alarmDuration": 300
}
```

**Required:**
- `platform`: Must be "REVPlusAlarm"
- `name`: Platform display name
- `accessToken`: REV Plus WebSocket API token (created in portal with "WS Alarm API" permission)

**Optional:**
- `alarmDuration`: Seconds before alarm sensor auto-resets (default: 300)

## Installation Distribution

This plugin is distributed directly from GitHub (not npm):
```bash
npm install -g git+https://github.com/lidonius1122/homebridge-revplus.git
```

The repository includes compiled `dist/` files in version control to enable GitHub installation without requiring users to build. When making changes:
1. Always run `npm run build` before committing
2. Commit both source (`src/`) and compiled (`dist/`) files
3. Test GitHub installation format before pushing

## REV Plus API Notes

- WebSocket URL: `wss://broker.einsatzverwaltung.de/alarm`
- Authentication via `AccessToken` query parameter
- No initial availability status sent on connection - must wait for first status change
- Message types: `connected` (user info), `alert` (emergency dispatch), `availability` (status change), `update` (ignored per requirements)
- Availability status codes: 0=Available, 1=Delayed, 2=NotAvailable, 3=PermanentlyNotAvailable, 4=Vacation, 5=Sick, 6=Quarantine
- Alert messages include: einsatznummer, stichwort, address, groups, priority, SOSI flag
