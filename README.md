# Homebridge REV Plus Alarm

Homebridge-Plugin zur Integration von REV Plus Feuerwehr-Alarmierungen in Apple HomeKit.

## Features

- **Verfügbarkeits-Schalter**: Zeigt deinen REV Plus Verfügbarkeitsstatus in HomeKit an
  - AN: Verfügbar oder Verspätet verfügbar
  - AUS: Nicht verfügbar, Urlaub, Krank, Quarantäne
  - Status wird persistent gespeichert und bei Neustart wiederhergestellt

- **Alarm-Kontaktsensor**: Wird bei Einsatzalarmierung getriggert
  - Automatischer Reset nach konfigurierbarer Zeit (Standard: 5 Minuten)
  - Detaillierte Alarm-Informationen im Homebridge-Log

- **HomeKit Automatisierungen**: Nutze Alarme für Automatisierungen
  - Lichter einschalten bei Alarm
  - Benachrichtigungen an andere Geräte
  - Szenen aktivieren
  - Und vieles mehr...

## Installation

### Direkt von GitHub (empfohlen)

Da das Plugin noch nicht auf npmjs.com veröffentlicht ist, installiere es direkt von GitHub:

```bash
npm install -g git+https://github.com/lidonius1122/homebridge-revplus.git
```

**Hinweis:** Das Plugin enthält bereits die kompilierten JavaScript-Dateien im Repository, daher ist kein Build-Prozess bei der Installation notwendig.

### Via Homebridge Config UI X

Alternativ kannst du das Plugin auch über die Homebridge Config UI installieren:

1. Öffne die Homebridge Config UI
2. Gehe zu "Plugins" → "Install Plugin"
3. Gib ein: `git+https://github.com/lidonius1122/homebridge-revplus.git`
4. Klicke auf "Install"

### Via npm (zukünftig)

Sobald das Plugin auf npmjs.com veröffentlicht wird:

```bash
npm install -g homebridge-revplus
```

## Konfiguration

### 1. REV Plus Access Token erstellen

1. Melde dich im [REV Plus Cloud-Portal](https://portal.revplus.cloud/) an
2. Navigiere zu **Access Tokens**
3. Klicke auf **Neuen PAT erstellen**
4. Vergib einen Namen (z.B. "Homebridge")
5. Aktiviere die Berechtigung **WS Alarm API**
6. Klicke auf **Zugriffsschlüssel erstellen**
7. **Wichtig:** Kopiere den Token sofort - er wird nur einmalig angezeigt!

### 2. Plugin konfigurieren

#### Via Homebridge Config UI X

1. Öffne die Homebridge Config UI
2. Gehe zu "Plugins" und suche dein installiertes REV Plus Plugin
3. Klicke auf "Einstellungen"
4. Trage deinen Access Token ein
5. Optional: Passe die Alarm-Dauer an (Standard: 300 Sekunden / 5 Minuten)
6. Speichern und Homebridge neu starten

#### Manuell in config.json (Empfohlen wenn Plugin nicht in UI angezeigt wird)

**Schritt 1: config.json Datei finden und öffnen**

Die Homebridge Konfigurationsdatei liegt normalerweise hier:
- Standard-Installation: `/var/lib/homebridge/config.json`
- Docker: Im gemounteten Volume (z.B. `/homebridge/config.json`)
- Manuelle Installation: `~/.homebridge/config.json`

**Schritt 2: config.json bearbeiten**

Öffne die Datei mit einem Editor (z.B. `nano`, `vi`, oder über die Config UI):

```bash
# Beispiel mit nano:
sudo nano /var/lib/homebridge/config.json
```

**Schritt 3: Plugin zur Platform-Liste hinzufügen**

Füge folgenden Block in das `"platforms"` Array ein:

```json
{
  "bridge": {
    "name": "Homebridge",
    "username": "...",
    "port": 51826,
    "pin": "..."
  },
  "platforms": [
    {
      "platform": "REVPlusAlarm",
      "name": "REV Plus Alarm",
      "accessToken": "DEIN_REV_PLUS_TOKEN_HIER",
      "alarmDuration": 300
    }
  ]
}
```

**Wichtig:**
- Ersetze `DEIN_REV_PLUS_TOKEN_HIER` mit deinem tatsächlichen REV Plus Access Token
- `alarmDuration` ist optional (Standard: 300 Sekunden = 5 Minuten)
- Achte auf korrekte JSON-Syntax (Kommas zwischen Einträgen!)

**Schritt 4: Homebridge neu starten**

```bash
# Systemd (Standard):
sudo systemctl restart homebridge

# Docker:
docker restart homebridge

# Manuell (wenn als Service läuft):
sudo service homebridge restart
```

**Schritt 5: Installation überprüfen**

Nach dem Neustart kannst du im Homebridge-Log prüfen, ob das Plugin geladen wurde:

```bash
# Log anzeigen:
sudo journalctl -u homebridge -f

# Oder in der Config UI unter "Logs"
```

Du solltest Meldungen wie diese sehen:
```
[REV Plus Alarm] REV Plus Platform finished initializing
[REV Plus Alarm] Setting up WebSocket connection...
[REV Plus Alarm] Connecting to REV Plus WebSocket API...
```

**Konfigurationsparameter:**

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|--------------|----------|--------------|
| `platform` | string | Ja | - | Muss `REVPlusAlarm` sein |
| `name` | string | Ja | - | Name der Platform in Homebridge |
| `accessToken` | string | Ja | - | Dein REV Plus WebSocket API Token |
| `alarmDuration` | number | Nein | 300 | Dauer in Sekunden, wie lange der Alarm-Kontaktsensor aktiv bleibt |

## Verwendung in HomeKit

### Geräte

Nach der Installation findest du zwei neue Geräte in der Home-App:

1. **REV Plus Verfügbarkeit** (Schalter)
   - Zeigt deinen aktuellen Verfügbarkeitsstatus
   - Read-only (Status kann nur über die REV Plus App geändert werden)

2. **REV Plus Einsatzalarm** (Kontaktsensor)
   - Wird bei Alarmierung getriggert (Kontakt "offen")
   - Setzt sich automatisch nach konfigurierbarer Zeit zurück

### Automatisierungen erstellen

**Beispiel 1: Lichter bei Alarm einschalten**
1. Home-App öffnen → Automation → Neue Automation
2. "Wenn ein Sensor etwas erkennt" → REV Plus Einsatzalarm → "Wird geöffnet"
3. Aktion hinzufügen: Lichter einschalten
4. Fertig

**Beispiel 2: Benachrichtigung bei Alarm**
1. Home-App öffnen → Automation → Neue Automation
2. "Wenn ein Sensor etwas erkennt" → REV Plus Einsatzalarm → "Wird geöffnet"
3. Aktion hinzufügen: Benachrichtigung senden (iOS 17+)
4. Nachrichtentext eingeben
5. Fertig

**Beispiel 3: Szene nur wenn verfügbar**
1. Erstelle eine Automation mit beliebigem Trigger
2. Füge Bedingung hinzu: "REV Plus Verfügbarkeit" ist "AN"
3. Füge Aktionen hinzu
4. Fertig

## Logging

Das Plugin schreibt detaillierte Informationen ins Homebridge-Log:

```
[REV Plus Alarm] Connecting to REV Plus WebSocket API...
[REV Plus Alarm] WebSocket connection established
[REV Plus Alarm] Connected as: max.mustermann@feuerwehr-beispiel.de
[REV Plus Alarm] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[REV Plus Alarm] ALARM RECEIVED
[REV Plus Alarm] Einsatznummer: 12345
[REV Plus Alarm] Stichwort: H-1 - Türöffnung
[REV Plus Alarm] Meldung: Person hinter Tür
[REV Plus Alarm] Adresse: Hauptstraße 12, 12345 Teststadt
[REV Plus Alarm] Objekt: Grundschule
[REV Plus Alarm] Deine Gruppen: Stadtteil A-Dorf
[REV Plus Alarm] Priorität: 2 | SOSI: Ja
[REV Plus Alarm] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[REV Plus Alarm] Triggering alarm contact sensor
[REV Plus Alarm] Alarm sensor will auto-reset in 300 seconds
```

## Troubleshooting

### Plugin erscheint nicht in Config UI X nach Installation

- Homebridge neu starten nach der Installation
- Browser-Cache leeren und Config UI neu laden
- Prüfe ob das Plugin installiert ist: `npm list -g homebridge-revplus`
- **Lösung:** Manuelle Konfiguration in config.json (siehe oben)

### Plugin startet nicht / Fehler beim Laden

- Überprüfe, ob der Access Token korrekt konfiguriert ist
- Stelle sicher, dass der Token die Berechtigung "WS Alarm API" hat
- Prüfe, ob der Token noch gültig ist (Token laufen nach einer bestimmten Zeit ab)
- **JSON-Syntax:** Achte auf korrekte Kommas und Anführungszeichen in der config.json
- Prüfe das Homebridge-Log auf Fehlermeldungen: `sudo journalctl -u homebridge -f`

### Keine Alarme empfangen

- Überprüfe die Verbindung im Homebridge-Log
- Teste, ob die REV Plus App Alarme empfängt
- Stelle sicher, dass der Token die richtigen Berechtigungen hat

### Verfügbarkeitsstatus wird nicht aktualisiert

- Die API sendet keinen initialen Status beim Verbindungsaufbau
- Der Status wird erst aktualisiert, wenn du ihn in der REV Plus App änderst
- Der letzte bekannte Status wird persistent gespeichert

### WebSocket-Verbindung bricht ab

- Das Plugin versucht automatisch, die Verbindung wiederherzustellen
- Bei wiederholten Abbrüchen prüfe deine Internetverbindung
- Überprüfe, ob der Token noch gültig ist

## API Dokumentation

Vollständige REV Plus API-Dokumentation: [API.md](API.md)

## Entwicklung

### Projekt builden

```bash
# Dependencies installieren
npm install

# TypeScript kompilieren
npm run build

# Plugin lokal linken (für Entwicklung)
npm link

# Watch mode (automatisches Neukompilieren bei Änderungen)
npm run watch
```

### Projekt-Struktur

```
homebridge-revplus/
├── src/
│   ├── index.ts              # Plugin Entry Point
│   ├── platform.ts           # Haupt-Platform-Klasse
│   ├── settings.ts           # Typen und Konstanten
│   ├── websocketClient.ts    # WebSocket-Client
│   ├── availabilityAccessory.ts  # Verfügbarkeits-Schalter
│   └── alarmAccessory.ts     # Alarm-Kontaktsensor
├── config.schema.json        # Homebridge Config UI Schema
├── package.json
├── tsconfig.json
└── README.md
```

## Lizenz

MIT

## Support

Bei Fragen oder Problemen mit diesem Plugin:
- GitHub Issues: [https://github.com/lidonius1122/homebridge-revplus/issues](https://github.com/lidonius1122/homebridge-revplus/issues)

## Changelog

### 1.0.0
- Initiale Release
- Verfügbarkeits-Schalter mit Status-Persistierung
- Alarm-Kontaktsensor mit automatischem Reset
- Detailliertes Logging
- Automatische Wiederverbindung bei Verbindungsabbruch
