# REV Plus WebSocket Alarm API - Dokumentation

## Übersicht

Die REV Plus Cloud bietet eine WebSocket-basierte Alarm API zur Anbindung von Smart-Home Lösungen und eigenen Applikationen. Die API ermöglicht das Empfangen von Echtzeit-Alarmierungen, Einsatz-Updates und Verfügbarkeitsmeldungen.

## Authentifizierung

### Personal Access Token (PAT) erstellen

1. Melde dich im [REV Plus Cloud-Portal](https://portal.revplus.cloud/) an
2. Navigiere zu **Access Tokens**
3. Klicke auf **Neuen PAT erstellen**
4. Vergib einen Namen für den Token
5. Aktiviere die Berechtigung **WS Alarm API**
6. Klicke auf **Zugriffsschlüssel erstellen**
7. **Wichtig:** Kopiere den Token sofort - er wird nur einmalig angezeigt!

⚠️ **Hinweis:** Access Tokens laufen nach einer bestimmten Zeit ab. Den Gültigkeitszeitraum kannst du in der Token-Liste einsehen.

## WebSocket Verbindung

### Endpoint

```
wss://broker.einsatzverwaltung.de/alarm?AccessToken=<YOUR_TOKEN>
```

### Verbindungsaufbau

**Beispiel (Python):**
```python
import asyncio
import websockets

async def connect():
    token = "your_personal_access_token"
    url = f"wss://broker.einsatzverwaltung.de/alarm?AccessToken={token}"

    async with websockets.connect(url) as websocket:
        async for message in websocket:
            print(message)

asyncio.run(connect())
```

**Beispiel (Node.js):**
```javascript
const WebSocket = require('ws');

const token = 'your_personal_access_token';
const ws = new WebSocket(`wss://broker.einsatzverwaltung.de/alarm?AccessToken=${token}`);

ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log(message);
});
```

## Nachrichtentypen

Alle Nachrichten sind im JSON-Format und folgen diesem Schema:

```json
{
    "type": "message_type",
    "message": {
        // Nachrichtenspezifische Daten
    }
}
```

### 1. Connected (Verbindungsbestätigung)

Wird beim erfolgreichen Verbindungsaufbau gesendet.

**Type:** `connected`

**Beispiel:**
```json
{
    "type": "connected",
    "message": {
        "message": "You are now connected to REV Plus - Websocket Alert API",
        "user": "max.mustermann@feuerwehr-beispiel.de"
    }
}
```

**Felder:**
- `message` (string): Willkommensnachricht
- `user` (string): Email-Adresse des authentifizierten Benutzers

---

### 2. Alert (Alarmierung)

Wird gesendet, sobald eine neue Alarmierung an dein Smartphone gesendet wurde.

**Type:** `alert`

**Beispiel:**
```json
{
    "type": "alert",
    "message": {
        "alertId": "6834ad48-c361-42ac-8b06-1ae34471a908",
        "alarmLevel": 0,
        "groups": [
            "Leitung der Feuerwehr",
            "Stadtteil A-Dorf",
            "Stadtteil B-Dorf"
        ],
        "myGroups": [
            "Stadtteil A-Dorf"
        ],
        "properties": {
            "kwk": false,
            "abbruch": false,
            "sosi": true,
            "prio": 2
        },
        "stichwort": {
            "eart": "H",
            "indikation": "12",
            "gruppe": "H-1",
            "stichwort": "Türöffnung",
            "diagnose": null,
            "meldung": "Person hinter Tür"
        },
        "einsatzort": {
            "strasse": "Hauptstraße",
            "hnr": "12",
            "plz": "12345",
            "stadt": "Teststadt",
            "stadtteil": "A-Dorf",
            "objekt": {
                "name": "Grundschule"
            }
        },
        "bemerkung": "Testbemerkung",
        "einsatznummer": "12345"
    }
}
```

**Felder:**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `alertId` | string (UUID) | Eindeutige ID der Alarmierung |
| `alarmLevel` | integer | Alarmstufe |
| `groups` | array[string] | Alle alarmierten Gruppen |
| `myGroups` | array[string] | Deine alarmierten Gruppen |
| `properties` | object | Einsatzeigenschaften |
| `properties.kwk` | boolean | Krankenwagenbegleitung |
| `properties.abbruch` | boolean | Abbruch-Flag |
| `properties.sosi` | boolean | Sondersignal erforderlich |
| `properties.prio` | integer | Prioritätsstufe (1-3) |
| `stichwort` | object | Einsatzstichwort |
| `stichwort.eart` | string | Einsatzart (z.B. "H" für Hilfeleistung) |
| `stichwort.indikation` | string | Indikationsnummer |
| `stichwort.gruppe` | string | Stichwortgruppe (z.B. "H-1") |
| `stichwort.stichwort` | string | Stichwortbezeichnung |
| `stichwort.diagnose` | string/null | Diagnose (optional) |
| `stichwort.meldung` | string | Einsatzmeldung |
| `einsatzort` | object | Einsatzadresse |
| `einsatzort.strasse` | string | Straßenname |
| `einsatzort.hnr` | string | Hausnummer |
| `einsatzort.plz` | string | Postleitzahl |
| `einsatzort.stadt` | string | Stadt |
| `einsatzort.stadtteil` | string | Stadtteil/Ortsteil |
| `einsatzort.objekt` | object/null | Objektinformationen (optional) |
| `einsatzort.objekt.name` | string | Objektname |
| `bemerkung` | string | Zusätzliche Bemerkungen |
| `einsatznummer` | string | Einsatznummer |

---

### 3. Update (Einsatz-Update)

Wird gesendet, wenn nachträgliche Änderungen an den Einsatzdaten vorgenommen werden oder weitere Alarmgruppen ausgelöst werden (auch solche, die dich nicht betreffen).

**Type:** `update`

**Struktur:** Identisch mit `alert` (siehe oben)

**Unterschied zu Alert:**
- `alert`: Initiale Alarmierung
- `update`: Nachträgliche Änderungen am selben Einsatz

Die `alertId` bleibt bei Updates gleich, sodass Updates dem ursprünglichen Alarm zugeordnet werden können.

---

### 4. Availability (Verfügbarkeitsänderung)

Wird gesendet, sobald du deinen Verfügbarkeitsstatus in der App geändert hast.

**Type:** `availability`

**Beispiel:**
```json
{
    "type": "availability",
    "message": {
        "availability": 0,
        "organization": "0b3b0e84-d260-4e2e-b873-c2fe99475087"
    }
}
```

**Felder:**
- `availability` (integer): Verfügbarkeitsstatus (siehe unten)
- `organization` (string/UUID): ID der Organisation

**Verfügbarkeitsstatus:**

| Wert | Status | Beschreibung |
|------|--------|--------------|
| 0 | Verfügbar | Einsatzbereit |
| 1 | Verspätet verfügbar | Verfügbar mit Verzögerung |
| 2 | Nicht verfügbar | Aktuell nicht verfügbar |
| 3 | Dauerhaft nicht verfügbar | Längerfristig nicht verfügbar |
| 4 | Urlaub | Im Urlaub |
| 5 | Krank | Krankheitsbedingt nicht verfügbar |
| 6 | Quarantäne | In Quarantäne |

---

## API-Einschränkungen

### Read-Only

Die WebSocket-API ist **nur zum Empfangen** von Daten konzipiert.

**Du kannst:**
- ✅ Alarmierungen empfangen
- ✅ Einsatz-Updates empfangen
- ✅ Verfügbarkeitsänderungen überwachen

**Du kannst nicht:**
- ❌ Verfügbarkeitsstatus über WebSocket ändern
- ❌ Einsatzdaten ändern
- ❌ Aktive Anfragen an die API senden

Status-Änderungen müssen über die offizielle REV Plus App vorgenommen werden.

### Kein initialer Status

Beim Verbindungsaufbau wird **nicht** der aktuelle Verfügbarkeitsstatus übermittelt. Die `availability`-Nachricht wird nur gesendet, wenn sich der Status **ändert**.

### Token-Ablauf

Access Tokens haben eine begrenzte Gültigkeitsdauer. Stelle sicher, dass:
- Du den Ablaufzeitpunkt überwachst
- Rechtzeitig ein neuer Token erstellt wird
- Deine Anwendung bei abgelaufenen Tokens eine Fehlermeldung anzeigt

---

## Best Practices

### Fehlerbehandlung

```python
import asyncio
import websockets
import json

async def handle_connection():
    token = "your_token"
    url = f"wss://broker.einsatzverwaltung.de/alarm?AccessToken={token}"

    try:
        async with websockets.connect(url) as websocket:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    # Verarbeite Nachricht
                except json.JSONDecodeError:
                    print("Invalid JSON received")
                except Exception as e:
                    print(f"Error processing message: {e}")

    except websockets.exceptions.ConnectionClosed:
        print("Connection closed")
    except Exception as e:
        print(f"Connection error: {e}")

asyncio.run(handle_connection())
```

### Reconnect-Logik

Implementiere eine Wiederverbindung bei Verbindungsabbrüchen:

```python
async def connect_with_retry(token, max_retries=5):
    retries = 0

    while retries < max_retries:
        try:
            await handle_connection(token)
        except Exception as e:
            retries += 1
            wait_time = min(2 ** retries, 60)  # Exponential backoff
            print(f"Retry {retries}/{max_retries} in {wait_time}s")
            await asyncio.sleep(wait_time)
```

### Datenbank-Persistierung

Für langfristige Auswertungen solltest du Alarme in einer Datenbank speichern:

```python
import sqlite3

def save_alarm(alert_data):
    conn = sqlite3.connect('alarms.db')
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO alarms (alert_id, timestamp, einsatznummer, ...)
        VALUES (?, ?, ?, ...)
    ''', (
        alert_data['alertId'],
        datetime.now(),
        alert_data['einsatznummer'],
        ...
    ))

    conn.commit()
    conn.close()
```

### Benachrichtigungen

Sende Desktop- oder Push-Benachrichtigungen bei Alarmen:

```python
import os

def send_notification(title, message):
    # Linux (notify-send)
    os.system(f'notify-send "{title}" "{message}" -u critical')

    # macOS (osascript)
    # os.system(f'osascript -e \'display notification "{message}" with title "{title}"\'')
```

---

## Beispiel-Implementierungen

### Minimal-Beispiel (Python)

```python
#!/usr/bin/env python3
import asyncio
import websockets
import json

async def main():
    token = "your_token"
    url = f"wss://broker.einsatzverwaltung.de/alarm?AccessToken={token}"

    async with websockets.connect(url) as ws:
        print("Connected!")

        async for message in ws:
            data = json.loads(message)
            msg_type = data.get("type")

            if msg_type == "alert":
                print(f"🚨 Alarm: {data['message']['einsatznummer']}")
            elif msg_type == "availability":
                print(f"📊 Status: {data['message']['availability']}")

asyncio.run(main())
```

### Node-RED Flow

Ein vorgefertigter Node-RED Flow ist in der offiziellen Dokumentation verfügbar.

---

## Troubleshooting

### Verbindung schlägt fehl

**Mögliche Ursachen:**
- Token ist abgelaufen → Neuen Token erstellen
- Token hat keine WS Alarm API Berechtigung → Berechtigungen prüfen
- Netzwerkprobleme → Internetverbindung prüfen

### Keine Nachrichten empfangen

**Prüfe:**
- WebSocket-Verbindung ist aktiv
- Token ist gültig
- Bei `availability`: Status wurde **während** Verbindung geändert (nicht vorher)

### Unvollständige Daten

**Hinweis:** Nicht alle Felder sind bei jedem Alarm gefüllt:
- `objekt` kann `null` sein
- `diagnose` ist optional
- `bemerkung` kann leer sein

Prüfe immer auf `null`/`undefined` vor dem Zugriff.

---

## Support

Bei Fragen zur API wende dich an:
- REV Plus Support: [support@revosax.de](mailto:support@revosax.de)
- Offizielle Dokumentation: [docs.einsatzverwaltung.de](https://docs.einsatzverwaltung.de)

---

## Änderungshistorie

| Datum | Version | Änderung |
|-------|---------|----------|
| 2025-01-04 | 1.0 | Initiale Dokumentation erstellt |

---

**Hinweis:** Diese Dokumentation wurde auf Basis der öffentlich verfügbaren REV Plus API-Dokumentation und eigenen Tests erstellt. Offizielle Änderungen an der API können von dieser Dokumentation abweichen.
