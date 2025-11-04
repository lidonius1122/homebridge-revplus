"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = exports.AvailabilityStatus = exports.WS_API_URL = exports.PLUGIN_NAME = exports.PLATFORM_NAME = void 0;
exports.PLATFORM_NAME = 'REVPlusAlarm';
exports.PLUGIN_NAME = 'homebridge-revplus';
exports.WS_API_URL = 'wss://broker.einsatzverwaltung.de/alarm';
var AvailabilityStatus;
(function (AvailabilityStatus) {
    AvailabilityStatus[AvailabilityStatus["Available"] = 0] = "Available";
    AvailabilityStatus[AvailabilityStatus["DelayedAvailable"] = 1] = "DelayedAvailable";
    AvailabilityStatus[AvailabilityStatus["NotAvailable"] = 2] = "NotAvailable";
    AvailabilityStatus[AvailabilityStatus["PermanentlyNotAvailable"] = 3] = "PermanentlyNotAvailable";
    AvailabilityStatus[AvailabilityStatus["Vacation"] = 4] = "Vacation";
    AvailabilityStatus[AvailabilityStatus["Sick"] = 5] = "Sick";
    AvailabilityStatus[AvailabilityStatus["Quarantine"] = 6] = "Quarantine";
})(AvailabilityStatus || (exports.AvailabilityStatus = AvailabilityStatus = {}));
var MessageType;
(function (MessageType) {
    MessageType["Connected"] = "connected";
    MessageType["Alert"] = "alert";
    MessageType["Update"] = "update";
    MessageType["Availability"] = "availability";
})(MessageType || (exports.MessageType = MessageType = {}));
//# sourceMappingURL=settings.js.map