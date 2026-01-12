# Supabase Email Templates

Diese Email-Templates müssen im Supabase Dashboard konfiguriert werden.

## Anleitung zum Hochladen der Templates

### 1. Supabase Dashboard öffnen
Gehe zu: https://supabase.com/dashboard/project/[DEIN_PROJECT_ID]/auth/templates

### 2. Templates konfigurieren

Für jedes Template (confirm-signup, magic-link, recovery, email-change):

1. Wähle den entsprechenden Template-Typ im Dashboard
2. Kopiere den HTML-Code aus der entsprechenden `.html` Datei
3. Füge ihn in das "Email Body" Feld ein
4. Konfiguriere den Betreff:

#### Bestätigungs-Email (confirm-signup.html)
**Template:** Confirm signup
**Subject (DE):** Bestätige deine E-Mail für Trainingsplan Generator
**Subject (EN):** Confirm your email for Training Plan Generator

#### Magic Link (magic-link.html)
**Template:** Magic Link
**Subject (DE):** Dein Anmelde-Link für Trainingsplan Generator
**Subject (EN):** Your sign-in link for Training Plan Generator

#### Passwort zurücksetzen (recovery.html)
**Template:** Reset Password
**Subject (DE):** Passwort zurücksetzen - Trainingsplan Generator
**Subject (EN):** Reset your password - Training Plan Generator

#### E-Mail ändern (email-change.html)
**Template:** Change Email Address
**Subject (DE):** E-Mail-Adresse bestätigen - Trainingsplan Generator
**Subject (EN):** Confirm email address - Training Plan Generator

### 3. Verfügbare Variablen

Supabase stellt folgende Variablen bereit:

- `{{ .ConfirmationURL }}` - Der Bestätigungs-Link
- `{{ .Token }}` - Der Bestätigungs-Token
- `{{ .TokenHash }}` - Der gehashte Token
- `{{ .SiteURL }}` - Die Website-URL
- `{{ .Locale }}` - Die Sprache (de oder en)

### 4. Spracherkennung

Die Templates verwenden automatisch die Browser-Sprache des Benutzers:
- `{{ .Locale }}` wird von Supabase automatisch gesetzt
- Unterstützte Sprachen: Deutsch (de) und Englisch (en)
- Fallback ist Deutsch (de)

### 5. Design-System

Die Templates verwenden das gleiche Design-System wie die App:
- **Primary Color:** #3b82f6 (Blau) - für normale Aktionen
- **Danger Color:** #ef4444 (Rot) - für Passwort-Reset
- **Warning Color:** #f59e0b (Orange) - für E-Mail-Änderungen
- **Font:** System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', etc.)
- **Border Radius:** 8px für Buttons, 16px für Cards
- **Responsive Design:** Mobile-first mit max-width: 600px

## Testen der Templates

### Lokale Entwicklung
Bei lokaler Entwicklung mit Supabase CLI werden die Standard-Templates verwendet.

### Production Testing
1. Gehe zu: Authentication → Email Templates
2. Klicke auf "Send test email" für jedes Template
3. Überprüfe das Layout in verschiedenen E-Mail-Clients

## Aktualisierung der Sprache

Um die Sprachunterstützung zu erweitern:
1. Füge weitere `{{ if eq .Locale "xx" }}` Blöcke hinzu
2. Übersetze alle Texte
3. Update die README mit den neuen Sprachen
