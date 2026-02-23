<div align="center">
  <img src="public/zenit-it_black.png" alt="zenit-it Logo" width="200"/>

  # zenit-it

  **Erstelle, verwalte und teile personalisierte Trainingspläne für Läufer**

  [![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Latest-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
  [![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite)](https://vitejs.dev/)

  [Features](#-features) • [Installation](#-installation) • [Dokumentation](#-dokumentation) • [Demo](#-demo)
</div>

---

## 📖 Über das Projekt

Der **zenit-it** ist eine moderne Web-Anwendung für Läufer, die ihre Trainingspläne selbst erstellen, verwalten und mit der Community teilen möchten. Von 5K bis Marathon – erstelle individuelle Pläne mit verschiedenen Trainingseinheiten, exportiere sie als PDF oder JSON, und entdecke Pläne von anderen Läufern im integrierten Marktplatz.

### 🎯 Hauptziele

- **Individualisierung**: Erstelle Trainingspläne passend zu deinem Event und Zeitplan
- **Flexibilität**: Passe Pläne jederzeit an (Zeitraum, Einheiten, Intensität)
- **Community**: Teile deine Pläne und profitiere von anderen Läufern
- **Export**: PDF für unterwegs, JSON für Backups

---

## ✨ Features

### 📅 Trainingsplan-Erstellung
- **Event-Konfiguration**
  - Distanzen: 5K, 10K, Halbmarathon, Marathon, Custom
  - Terrain: Straße, Trail, Bahn, Mixed
  - Zielzeit mit automatischer Pace-Berechnung
  - Höhenmeter-Planung für Trailläufe

- **Wochen-basierte Planung**
  - Automatische Wochen-Berechnung (Start- bis Event-Datum)
  - Visuelle Übersicht mit Kilometer-Chart (Recharts)
  - Trainingseinheiten: Locker, Lang, Intervall, Tempo, Recovery, Race

- **Intervall-Training**
  - Detaillierte Intervall-Planung
  - Warm-up & Cool-down (km oder Minuten)
  - Repetitionen mit Recovery-Zeiten

- **Auto-Save**
  - Automatisches Speichern alle 2 Sekunden
  - Echtzeit-Synchronisation mit Supabase
  - "Zuletzt gespeichert"-Anzeige

### 🏪 Trainingsplan-Marktplatz
- **Plan-Sharing**
  - Veröffentlichung mit 3 Sichtbarkeits-Optionen:
    - 🔒 **Privat** (nur du)
    - 🌍 **Öffentlich mit Profil** (mit Name und Avatar)
    - 👤 **Öffentlich anonym** (ohne Name)
  - Beschreibung und Tags
  - Automatische Tags (Distanz, Dauer, Terrain)

- **Browse & Filter**
  - Volltext-Suche (Name, Beschreibung)
  - Tag-Filter (Anfänger, Fortgeschritten, Geschwindigkeit, etc.)
  - Sortierung: Neueste, Beliebt, Best-Bewertet, Meist kopiert
  - Pagination (12 Pläne pro Seite)

- **Social Features**
  - ❤️ **Likes** (Toggle on/off)
  - ⭐ **5-Sterne-Bewertung** (mit Durchschnitt)
  - 💬 **Kommentare** (Erstellen, Bearbeiten, Löschen)
  - 📊 **Statistiken** (Views, Clones, Likes, Rating)

- **Plan-Kopieren**
  - Zeitraum anpassbar (neues Start-/Event-Datum)
  - Automatische Anpassung der Trainingswochen
  - Event-Name ändern
  - In eigenes Dashboard kopieren

### 📤 Export-Funktionen
- **PDF-Export**
  - Professionelles Layout
  - Kilometer-Chart eingebettet
  - Alle Trainingseinheiten übersichtlich
  - Intervall-Details formatiert

- **JSON-Export/Import**
  - Backup-Funktion
  - Teilen mit anderen (offline)
  - Wiederherstellen alter Versionen

### 👤 User-Profil
- Avatar-Upload (Supabase Storage)
- Bio und Name
- Profil-Link im Marktplatz (optional)

### 📱 Responsive Design
- **Desktop**: Sidebar links, Toggle-Funktion
- **Mobile**: Hamburger-Menü, Sidebar-Overlay von rechts
- **Touch-optimiert**: Swipe-Gesten, große Touch-Targets

### 🎨 Design-System
- Tailwind CSS mit Custom Design-Tokens
- Konsistente Komponenten-Bibliothek
- Dark Mode ready (vorbereitet)
- Deutsche Lokalisierung

---

## 🚀 Installation

### Voraussetzungen
- Node.js 18+
- npm 9+
- Docker (für lokales Supabase)
- Git

### 1. Repository klonen
```bash
git clone https://github.com/johanneskasser/trainingsplan_generator.git
cd trainingsplan_generator
```

### 2. Dependencies installieren
```bash
npm install
```

### 3. Supabase Setup

#### Option A: Lokal (empfohlen für Development)
```bash
# Supabase CLI installieren (falls nicht vorhanden)
npm install -g supabase

# Supabase starten
npx supabase start

# Migrationen anwenden
npx supabase db push

# Supabase Status prüfen
npx supabase status
```

Die lokale Supabase-URL und den `anon key` findest du in der Ausgabe von `supabase status`.

#### Option B: Remote (Production)
1. Erstelle ein Projekt auf [supabase.com](https://supabase.com)
2. Kopiere Project URL und anon key
3. Verbinde mit dem Projekt:
   ```bash
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

### 4. Environment-Variablen

Erstelle eine `.env.local` Datei:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional: Vercel Analytics
VITE_VERCEL_ANALYTICS_ID=your_analytics_id
```

### 5. Development Server starten
```bash
npm run dev
```

Die App läuft jetzt auf `http://localhost:5173`

---

## 📚 Dokumentation

### Projekt-Struktur
```
trainingsplan_generator/
├── public/                    # Statische Assets
│   └── img.png               # Logo
├── src/
│   ├── components/           # React-Komponenten
│   │   ├── ui/              # UI-Komponenten (Button, Card, etc.)
│   │   ├── AppLayout.tsx    # Layout mit Header & Sidebar
│   │   ├── PageHeader.tsx   # Dynamischer Page Header
│   │   ├── Sidebar.tsx      # Navigation
│   │   ├── ClonePlanModal.tsx
│   │   └── PublishPlanModal.tsx
│   ├── contexts/            # React Contexts
│   │   ├── AuthContext.tsx  # Authentifizierung
│   │   └── ToastContext.tsx # Toast-Benachrichtigungen
│   ├── pages/               # Page-Komponenten
│   │   ├── Dashboard.tsx
│   │   ├── MarketplacePage.tsx
│   │   ├── PlanDetailPage.tsx
│   │   ├── PlanEditor.tsx
│   │   ├── ProfilePage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/            # API-Services
│   │   ├── marketplaceService.ts
│   │   ├── profileService.ts
│   │   └── trainingPlanService.ts
│   ├── types/               # TypeScript-Typen
│   │   ├── index.ts         # Haupt-Typen
│   │   ├── database.ts      # Supabase-Typen
│   │   ├── marketplace.ts   # Marktplatz-Typen
│   │   └── profile.ts       # Profil-Typen
│   ├── utils/               # Utility-Funktionen
│   │   ├── calculationUtils.ts
│   │   ├── dateUtils.ts
│   │   ├── paceCalculator.ts
│   │   ├── pdfExport.ts
│   │   └── jsonExportImport.ts
│   ├── lib/                 # Libraries & Config
│   │   ├── designSystem.ts  # Design-System
│   │   └── supabase.ts      # Supabase-Client
│   └── App.tsx              # Root-Component
├── supabase/
│   ├── migrations/          # Datenbank-Migrationen
│   └── config.toml          # Supabase-Config
├── MARKETPLACE_SETUP.md     # Marktplatz-Dokumentation
└── CLAUDE.md                # Projekt-Kontext für AI
```

### Datenbank-Schema

#### Tabellen
- **`training_plans`** - Trainingspläne (mit Marktplatz-Feldern)
- **`user_profiles`** - User-Profile
- **`plan_likes`** - Likes für Pläne
- **`plan_ratings`** - 5-Sterne-Bewertungen
- **`plan_comments`** - Kommentare

Mehr Details: [MARKETPLACE_SETUP.md](MARKETPLACE_SETUP.md)

---

## 🎯 Verwendung

### Trainingsplan erstellen
1. Klicke auf **"Neuer Plan"** im Dashboard
2. Konfiguriere dein Event (Distanz, Datum, Zielzeit)
3. Füge Trainingseinheiten zu den Wochen hinzu
4. Exportiere als PDF oder JSON

### Plan veröffentlichen
1. Öffne einen Plan im Dashboard
2. Klicke auf **"Veröffentlichen"**
3. Wähle Sichtbarkeit (Öffentlich/Anonym)
4. Füge Beschreibung und Tags hinzu
5. Klicke **"Veröffentlichen"**

### Plan aus Marktplatz kopieren
1. Gehe zum **Marktplatz**
2. Suche oder filtere nach Plänen
3. Öffne Plan-Details
4. Klicke **"Plan kopieren & anpassen"**
5. Passe Zeitraum und Event-Name an
6. Der Plan wird in dein Dashboard kopiert

---

## 🛠️ Technologie-Stack

### Frontend
- **React 18.3** - UI-Framework
- **TypeScript 5.5** - Type Safety
- **Vite 5.4** - Build Tool & Dev Server
- **React Router 6** - Client-Side Routing
- **Tailwind CSS 3.4** - Styling
- **Lucide React** - Icons
- **Recharts** - Charts & Visualisierungen
- **date-fns** - Datums-Handling
- **jsPDF + html2canvas** - PDF-Export

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL - Datenbank
  - Authentication - User-Management
  - Storage - Avatar-Uploads
  - Row Level Security - Daten-Sicherheit

### Dev Tools
- **ESLint** - Code Linting
- **TypeScript** - Type Checking
- **Vercel Analytics** - Analytics (optional)



## 🤝 Contributing

Contributions sind willkommen!

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

### Development-Guidelines
- Schreibe TypeScript mit strikten Types
- Verwende das Design-System für Komponenten
- Teste auf Desktop & Mobile
- Dokumentiere neue Features im README

---

## 📝 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert - siehe [LICENSE](LICENSE) für Details.

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI-Framework
- [Supabase](https://supabase.com/) - Backend & Database
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide](https://lucide.dev/) - Icons
- [Recharts](https://recharts.org/) - Charts

---

## 📞 Support & Feedback

- **Issues**: [GitHub Issues](https://github.com/yourusername/trainingsplan_generator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/trainingsplan_generator/discussions)

---

<div align="center">

  **Erstellt mit ❤️ für die Lauf-Community**

  [⬆ Zurück nach oben](#zenit-it)

</div>
