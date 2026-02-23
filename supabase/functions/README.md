# Supabase Edge Functions

## iCal Subscription

Die `ical-subscription` Edge Function stellt einen öffentlichen Endpunkt bereit, über den Trainingsplan-Daten als iCal-Datei (.ics) abgerufen werden können.

### Deployment

Um die Edge Function zu deployen:

```bash
# Installiere Supabase CLI (falls noch nicht installiert)
npm install -g supabase

# Login bei Supabase
supabase login

# Link zu deinem Projekt
supabase link --project-ref <your-project-ref>

# Deploy der ical-subscription Funktion mit JWT-Verifikation deaktiviert
supabase functions deploy ical-subscription --no-verify-jwt
```

**Wichtig:** Die Edge Function benötigt die Environment Variable `SUPABASE_SERVICE_ROLE_KEY`, die automatisch von Supabase bereitgestellt wird. Diese wird verwendet, um RLS (Row Level Security) zu umgehen, damit iCal-Abonnements funktionieren.

### Verwendung

Nach dem Deployment ist die Funktion unter folgender URL verfügbar:

```text
https://<your-project-ref>.supabase.co/functions/v1/ical-subscription/<plan-id>
```

### Wie es funktioniert

1. Die Funktion empfängt eine Plan-ID als URL-Parameter
2. Sie lädt den Trainingsplan aus der `training_plans` Tabelle
3. Sie generiert eine iCal-Datei mit:
   - Dem Wettkampf-Event
   - Allen Trainingseinheiten als Kalender-Events
   - Detaillierten Beschreibungen für jede Einheit
4. Die Datei wird mit entsprechenden Headers zurückgegeben:
   - `Content-Type: text/calendar`
   - `Cache-Control: no-cache` (damit Änderungen sofort synchronisiert werden)

### Kalender-Abonnement

Benutzer können den Link in ihrer Kalender-App abonnieren:

- **Apple Kalender**: `webcal://<your-project-ref>.supabase.co/functions/v1/ical-subscription/<plan-id>`
- **Google Calendar**: Nutzt die HTTPS-URL direkt
- **Outlook**: Nutzt die HTTPS-URL direkt

Die Kalender-Apps aktualisieren das Abonnement regelmäßig (typischerweise stündlich), sodass Änderungen am Trainingsplan automatisch synchronisiert werden.

### Sicherheit

Die Funktion nutzt die Supabase ANON_KEY und ist öffentlich zugänglich. Wenn Sie die Sichtbarkeit einschränken möchten, können Sie:

1. Row Level Security (RLS) Policies in der `training_plans` Tabelle aktivieren
2. Eine Authentifizierung in der Edge Function implementieren
3. Plan-IDs als UUIDs verwenden (bereits der Fall), um sie schwer zu erraten

### Entwicklung

Um die Funktion lokal zu testen:

```bash
# Starte Supabase lokal
supabase start

# Serve die Funktion lokal
supabase functions serve ical-subscription

# Test mit curl
curl http://localhost:54321/functions/v1/ical-subscription/<plan-id>
```

### Umgebungsvariablen

Die Funktion benötigt folgende Umgebungsvariablen (automatisch von Supabase gesetzt):

- `SUPABASE_URL`: Die URL deines Supabase-Projekts
- `SUPABASE_ANON_KEY`: Der öffentliche API-Key
