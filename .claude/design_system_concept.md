# Design System - Trainingsplaner App

## 1. Designphilosophie

### Vision
Ein klares, fokussiertes Design System für ambitionierte Läufer, das Komplexität reduziert und Übersicht schafft. Die visuelle Sprache ist ruhig, professionell und unterstützt den analytischen Charakter der Trainingsplanung.

### Kernprinzipien
- **Klarheit vor Dekoration**: Jedes Element dient einem funktionalen Zweck
- **Konsistenz**: Einheitliche Muster schaffen Vertrautheit
- **Hierarchie**: Wichtige Informationen stechen hervor
- **Ruhe**: Genug Weißraum für konzentriertes Arbeiten
- **Datenintegrität**: Visualisierungen sind präzise und ehrlich

---

## 2. Farbsystem

### 2.1 Primärfarben (Core Palette)

Die Hauptpalette basiert auf kühlen, zurückhaltenden Blau-Grau-Tönen, die Professionalität und Ruhe vermitteln.

```typescript
const coreColors = {
  primary: {
    50: '#f0f5f7',   // Hellster Ton für Hintergründe
    100: '#bcd4de',  // Pale Sky - Haupthintergrund
    200: '#a5ccd1',  // Light Blue - Sekundäre Flächen
    300: '#a0b9bf',  // Cool Steel - Aktive States
    400: '#9dacb2',  // Cool Steel 2 - Hover States
    500: '#949ba0',  // Cool Steel 3 - Text auf hellen BG
    600: '#6b7378',  // Dunkler für wichtigen Text
    700: '#4a5155',  // Überschriften
    800: '#2d3235',  // Primärer Text
    900: '#1a1d1f',  // Dunkelster Text
  }
}
```

### 2.2 Funktionale Farben

```typescript
const semanticColors = {
  // Session Types (aus bestehendem System erweitert)
  sessionTypes: {
    easy: {
      bg: '#e8f4f8',      // Hellblau
      text: '#0369a1',    // Dunkelblau
      border: '#bcd4de',
      chart: '#7dd3fc',
    },
    long: {
      bg: '#f0f9ff',
      text: '#0c4a6e',
      border: '#a5ccd1',
      chart: '#38bdf8',
    },
    intervals: {
      bg: '#ffedd5',      // Warm Orange für Intensität
      text: '#c2410c',
      border: '#fed7aa',
      chart: '#fb923c',
    },
    tempo: {
      bg: '#fef3c7',      // Gelb für moderate Intensität
      text: '#a16207',
      border: '#fde68a',
      chart: '#fbbf24',
    },
    recovery: {
      bg: '#f0fdf4',      // Grün für Erholung
      text: '#15803d',
      border: '#bbf7d0',
      chart: '#4ade80',
    },
    race: {
      bg: '#ffe4e6',      // Rosa/Rot für Wettkampf
      text: '#be123c',
      border: '#fecdd3',
      chart: '#fb7185',
    }
  },
  
  // System Feedback
  success: {
    bg: '#d1fae5',
    text: '#065f46',
    border: '#6ee7b7',
  },
  warning: {
    bg: '#fef3c7',
    text: '#92400e',
    border: '#fde68a',
  },
  error: {
    bg: '#fee2e2',
    text: '#991b1b',
    border: '#fca5a5',
  },
  info: {
    bg: '#dbeafe',
    text: '#1e40af',
    border: '#93c5fd',
  },
  
  // UI States
  disabled: {
    bg: '#f1f5f9',
    text: '#94a3b8',
    border: '#cbd5e1',
  }
}
```

### 2.3 Neutrale Farben

```typescript
const neutralColors = {
  white: '#ffffff',
  background: {
    primary: '#fafbfc',    // Haupthintergrund
    secondary: '#f0f5f7',  // Cards, Panels
    tertiary: '#e5edef',   // Hover States
  },
  border: {
    light: '#e5edef',
    medium: '#a0b9bf',
    strong: '#6b7378',
  },
  text: {
    primary: '#1a1d1f',    // Haupttext
    secondary: '#4a5155',  // Sekundärtext
    tertiary: '#6b7378',   // Labels, Hints
    inverse: '#ffffff',    // Text auf dunklen BG
    disabled: '#94a3b8',
  }
}
```

---

## 3. Typografie

### 3.1 Schriftfamilien

```typescript
const typography = {
  fonts: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
  }
}
```

**Rationale**:
- Inter für ausgezeichnete Lesbarkeit bei Zahlen und Daten
- Monospace für Zeitangaben und Pace-Werte (z.B. "05:30 min/km")

### 3.2 Type Scale

```typescript
const typeScale = {
  // Display - Für Hero-Bereiche
  display: {
    size: '3rem',        // 48px
    lineHeight: '1.1',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  
  // Headings
  h1: {
    size: '2rem',        // 32px
    lineHeight: '1.2',
    fontWeight: '700',
    letterSpacing: '-0.01em',
  },
  h2: {
    size: '1.5rem',      // 24px
    lineHeight: '1.3',
    fontWeight: '600',
  },
  h3: {
    size: '1.25rem',     // 20px
    lineHeight: '1.4',
    fontWeight: '600',
  },
  h4: {
    size: '1.125rem',    // 18px
    lineHeight: '1.4',
    fontWeight: '600',
  },
  
  // Body Text
  bodyLarge: {
    size: '1.125rem',    // 18px
    lineHeight: '1.6',
    fontWeight: '400',
  },
  body: {
    size: '1rem',        // 16px
    lineHeight: '1.6',
    fontWeight: '400',
  },
  bodySmall: {
    size: '0.875rem',    // 14px
    lineHeight: '1.5',
    fontWeight: '400',
  },
  
  // Utility
  caption: {
    size: '0.75rem',     // 12px
    lineHeight: '1.4',
    fontWeight: '400',
    letterSpacing: '0.01em',
  },
  overline: {
    size: '0.75rem',     // 12px
    lineHeight: '1.4',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  
  // Numbers (für Distanzen, Zeiten)
  numberLarge: {
    size: '2rem',
    lineHeight: '1.2',
    fontWeight: '700',
    fontFamily: 'mono',
    tabularNums: true,   // Gleiche Ziffernbreite
  },
  number: {
    size: '1.5rem',
    lineHeight: '1.2',
    fontWeight: '600',
    fontFamily: 'mono',
    tabularNums: true,
  },
  numberSmall: {
    size: '1rem',
    lineHeight: '1.2',
    fontWeight: '500',
    fontFamily: 'mono',
    tabularNums: true,
  }
}
```

### 3.3 Typografie-Guidelines

- **Zahlen immer in Monospace**: Für Pace, Distanz, Zeit → bessere Vergleichbarkeit
- **Tabular Numbers**: Bei Listen und Tabellen für vertikale Ausrichtung
- **Max Line Length**: 65-75 Zeichen für optimale Lesbarkeit
- **Kontrast**: Mindestens 4.5:1 für normalen Text, 3:1 für großen Text (WCAG AA)

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

```typescript
const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
}
```

**Verwendung**:
- **1-2**: Sehr enge Abstände (Icons zu Text)
- **3-4**: Standard-Abstände innerhalb Komponenten
- **5-6**: Abstände zwischen verwandten Elementen
- **8-10**: Abstände zwischen Sektionen
- **12+**: Große Layout-Abstände

### 4.2 Container & Breakpoints

```typescript
const layout = {
  containers: {
    xs: '20rem',      // 320px - Mobile klein
    sm: '24rem',      // 384px - Mobile
    md: '28rem',      // 448px - Mobile groß
    lg: '32rem',      // 512px - Tablet klein
    xl: '36rem',      // 576px - Tablet
    '2xl': '42rem',   // 672px - Tablet groß
    '3xl': '48rem',   // 768px - Desktop klein
    '4xl': '56rem',   // 896px - Desktop
    '5xl': '64rem',   // 1024px - Desktop groß
    '6xl': '72rem',   // 1152px - Desktop sehr groß
    '7xl': '80rem',   // 1280px - Max-width für Content
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
}
```

### 4.3 Grid System

```typescript
const grid = {
  columns: 12,
  gap: {
    mobile: '1rem',    // 16px
    tablet: '1.5rem',  // 24px
    desktop: '2rem',   // 32px
  }
}
```

---

## 5. Komponenten

### 5.1 Buttons

```typescript
const buttonStyles = {
  // Primary - Hauptaktionen
  primary: {
    base: 'bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900',
    padding: 'px-4 py-2',
    borderRadius: 'rounded-lg',
    fontSize: 'text-base',
    fontWeight: 'font-medium',
    transition: 'transition-all duration-150',
    focus: 'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
  },
  
  // Secondary - Weniger wichtige Aktionen
  secondary: {
    base: 'bg-primary-100 text-primary-800 hover:bg-primary-200 active:bg-primary-300',
    border: 'border border-primary-300',
    // Rest wie primary
  },
  
  // Ghost - Tertiäre Aktionen
  ghost: {
    base: 'bg-transparent text-primary-700 hover:bg-primary-50 active:bg-primary-100',
    // Rest wie primary
  },
  
  // Danger - Destruktive Aktionen
  danger: {
    base: 'bg-error-bg text-error-text hover:bg-red-100 active:bg-red-200',
    border: 'border border-error-border',
  },
  
  // Sizes
  sizes: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
}
```

### 5.2 Input Fields

```typescript
const inputStyles = {
  base: {
    background: 'bg-white',
    border: 'border border-border-medium',
    borderRadius: 'rounded-lg',
    padding: 'px-4 py-2.5',
    fontSize: 'text-base',
    color: 'text-text-primary',
    placeholder: 'placeholder:text-text-tertiary',
    focus: 'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
    disabled: 'disabled:bg-disabled-bg disabled:text-disabled-text disabled:cursor-not-allowed',
    transition: 'transition-all duration-150',
  },
  
  // States
  error: 'border-error-border focus:ring-error-text',
  success: 'border-success-border focus:ring-success-text',
  
  // Labels
  label: {
    base: 'block text-sm font-medium text-text-secondary mb-1.5',
    required: 'after:content-["*"] after:ml-0.5 after:text-error-text',
  },
  
  // Helper Text
  helperText: {
    base: 'text-sm text-text-tertiary mt-1.5',
    error: 'text-error-text',
  }
}
```

### 5.3 Cards

```typescript
const cardStyles = {
  // Base Card
  base: {
    background: 'bg-background-secondary',
    border: 'border border-border-light',
    borderRadius: 'rounded-xl',
    padding: 'p-6',
    shadow: 'shadow-sm',
    hover: 'hover:shadow-md',
    transition: 'transition-shadow duration-200',
  },
  
  // Training Week Card
  weekCard: {
    base: 'bg-white border border-border-light rounded-xl',
    header: 'px-6 py-4 border-b border-border-light bg-background-primary',
    content: 'p-6',
    collapsed: 'cursor-pointer hover:bg-background-secondary',
  },
  
  // Session Card
  sessionCard: {
    base: 'bg-white border-l-4 rounded-lg p-4',
    // Border color dynamisch nach Session Type
    easy: 'border-l-sessionTypes-easy-chart',
    intervals: 'border-l-sessionTypes-intervals-chart',
    // etc.
  }
}
```

### 5.4 Badges & Tags

```typescript
const badgeStyles = {
  base: {
    padding: 'px-2.5 py-1',
    borderRadius: 'rounded-full',
    fontSize: 'text-xs',
    fontWeight: 'font-medium',
    display: 'inline-flex items-center gap-1',
  },
  
  // Session Type Badges (aus sessionTypes.ts)
  sessionType: {
    easy: 'bg-sessionTypes-easy-bg text-sessionTypes-easy-text',
    intervals: 'bg-sessionTypes-intervals-bg text-sessionTypes-intervals-text',
    // etc.
  },
  
  // Status Badges
  status: {
    active: 'bg-success-bg text-success-text',
    upcoming: 'bg-info-bg text-info-text',
    completed: 'bg-primary-100 text-primary-700',
  }
}
```

### 5.5 Modals & Dialogs

```typescript
const modalStyles = {
  overlay: {
    background: 'bg-black/50',
    backdrop: 'backdrop-blur-sm',
    position: 'fixed inset-0',
    zIndex: 'z-50',
    animation: 'animate-fade-in',
  },
  
  container: {
    position: 'fixed inset-0 overflow-y-auto',
    padding: 'p-4',
    display: 'flex items-center justify-center',
  },
  
  content: {
    background: 'bg-white',
    borderRadius: 'rounded-2xl',
    shadow: 'shadow-2xl',
    maxWidth: 'max-w-2xl',
    width: 'w-full',
    animation: 'animate-scale-in',
  },
  
  header: {
    padding: 'px-6 py-4',
    borderBottom: 'border-b border-border-light',
  },
  
  body: {
    padding: 'p-6',
    maxHeight: 'max-h-[70vh]',
    overflow: 'overflow-y-auto',
  },
  
  footer: {
    padding: 'px-6 py-4',
    borderTop: 'border-t border-border-light',
    display: 'flex justify-end gap-3',
  }
}
```

---

## 6. Datenvisualisierung

### 6.1 Chart-Styles (Recharts)

```typescript
const chartStyles = {
  // Chart Container
  container: {
    background: 'bg-white',
    padding: 'p-6',
    borderRadius: 'rounded-xl',
    border: 'border border-border-light',
  },
  
  // Bar Chart für Wochenkilometer
  barChart: {
    fill: sessionTypeColors, // Dynamisch nach Session Type
    radius: [8, 8, 0, 0],    // Abgerundete obere Ecken
    opacity: {
      default: 1,
      hover: 0.8,
    },
    animation: {
      duration: 300,
      easing: 'ease-out',
    }
  },
  
  // Grid & Axes
  grid: {
    stroke: '#e5edef',
    strokeDasharray: '3 3',
    opacity: 0.5,
  },
  
  axes: {
    tick: {
      fill: '#6b7378',
      fontSize: 12,
      fontFamily: 'Inter',
    },
    label: {
      fill: '#4a5155',
      fontSize: 14,
      fontWeight: 500,
    }
  },
  
  // Tooltip
  tooltip: {
    background: 'white',
    border: '1px solid #e5edef',
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  
  // Legend
  legend: {
    iconType: 'circle',
    fontSize: 14,
    color: '#4a5155',
  }
}
```

### 6.2 Tabellen

```typescript
const tableStyles = {
  container: {
    background: 'bg-white',
    border: 'border border-border-light',
    borderRadius: 'rounded-xl',
    overflow: 'overflow-hidden',
  },
  
  header: {
    row: 'bg-background-primary border-b border-border-light',
    cell: 'px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider',
  },
  
  body: {
    row: {
      base: 'border-b border-border-light hover:bg-background-secondary transition-colors',
      striped: 'even:bg-background-primary',
    },
    cell: {
      base: 'px-4 py-3 text-sm text-text-primary',
      numeric: 'font-mono tabular-nums text-right',
    }
  }
}
```

---

## 7. Animationen & Transitions

```typescript
const animations = {
  // Durations
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  // Easing Functions
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  
  // Common Animations
  fadeIn: {
    from: 'opacity-0',
    to: 'opacity-100',
    duration: 'duration-200',
  },
  
  scaleIn: {
    from: 'scale-95 opacity-0',
    to: 'scale-100 opacity-100',
    duration: 'duration-200',
  },
  
  slideDown: {
    from: 'translate-y-[-10px] opacity-0',
    to: 'translate-y-0 opacity-100',
    duration: 'duration-300',
  },
  
  // Hover States
  hover: {
    lift: 'hover:translate-y-[-2px] transition-transform duration-150',
    shadow: 'hover:shadow-lg transition-shadow duration-200',
    scale: 'hover:scale-105 transition-transform duration-150',
  }
}
```

---

## 8. Iconografie

### 8.1 Icon-System (Lucide React)

```typescript
const iconSystem = {
  // Sizes
  sizes: {
    xs: 14,
    sm: 16,
    base: 20,
    lg: 24,
    xl: 32,
  },
  
  // Usage Context
  usage: {
    // Training Session Icons
    sessions: {
      easy: 'Footprints',
      long: 'TrendingUp',
      intervals: 'Zap',
      tempo: 'Gauge',
      recovery: 'Heart',
      race: 'Trophy',
    },
    
    // Actions
    actions: {
      add: 'Plus',
      edit: 'Edit2',
      delete: 'Trash2',
      save: 'Save',
      export: 'Download',
      import: 'Upload',
      copy: 'Copy',
      share: 'Share2',
    },
    
    // Navigation
    navigation: {
      menu: 'Menu',
      close: 'X',
      back: 'ArrowLeft',
      forward: 'ArrowRight',
      expand: 'ChevronDown',
      collapse: 'ChevronUp',
    },
    
    // Status
    status: {
      success: 'CheckCircle',
      warning: 'AlertTriangle',
      error: 'XCircle',
      info: 'Info',
    },
    
    // Data
    data: {
      calendar: 'Calendar',
      clock: 'Clock',
      distance: 'Navigation',
      pace: 'Gauge',
      chart: 'BarChart3',
    }
  },
  
  // Style Guidelines
  stroke: {
    default: 2,
    thin: 1.5,
    thick: 2.5,
  }
}
```

---

## 9. Responsive Design

### 9.1 Mobile-First Approach

```typescript
const responsivePatterns = {
  // Layout Shifts
  stacking: {
    mobile: 'flex-col',
    tablet: 'md:flex-row',
  },
  
  // Component Adaptations
  weekCard: {
    mobile: {
      padding: 'p-4',
      fontSize: 'text-sm',
    },
    tablet: {
      padding: 'md:p-6',
      fontSize: 'md:text-base',
    }
  },
  
  // Navigation
  navigation: {
    mobile: 'fixed bottom-0 left-0 right-0',  // Bottom Nav
    desktop: 'lg:static lg:flex-row',          // Top Nav
  },
  
  // Modal Behavior
  modal: {
    mobile: 'fixed inset-0',           // Full Screen
    desktop: 'lg:max-w-2xl lg:rounded-2xl',  // Centered Dialog
  }
}
```

### 9.2 Touch Targets

```
Minimum Touch Target Size: 44x44px (WCAG 2.5.5)
Spacing between targets: min 8px
```

---

## 10. Accessibility

### 10.1 Farbkontrast

```typescript
const accessibilityStandards = {
  // WCAG AA Compliance
  contrast: {
    normalText: '4.5:1',
    largeText: '3:1',    // 18px+ oder 14px+ bold
    uiComponents: '3:1',
  },
  
  // Focus Indicators
  focusRing: {
    width: '2px',
    offset: '2px',
    color: 'primary-400',
    style: 'solid',
  },
  
  // Color Independence
  // Nie Information nur durch Farbe vermitteln
  indicators: {
    sessionType: 'Icon + Color + Label',
    status: 'Icon + Color + Text',
  }
}
```

### 10.2 Keyboard Navigation

```typescript
const keyboardSupport = {
  tabOrder: 'Logische Reihenfolge',
  skipLinks: 'Zum Hauptinhalt springen',
  shortcuts: {
    'Cmd/Ctrl + S': 'Plan speichern',
    'Cmd/Ctrl + E': 'Exportieren',
    'Escape': 'Modal schließen',
    'Enter': 'Aktion bestätigen',
  }
}
```

### 10.3 Screen Reader Support

```typescript
const ariaLabels = {
  // Semantische HTML-Elemente verwenden
  regions: {
    header: '<header>',
    main: '<main>',
    nav: '<nav>',
    aside: '<aside>',
  },
  
  // ARIA Labels
  buttons: {
    addSession: 'aria-label="Trainingseinheit hinzufügen"',
    deleteWeek: 'aria-label="Woche löschen"',
  },
  
  // Live Regions für dynamische Updates
  liveRegions: 'aria-live="polite"',
}
```

---

## 11. Performance

### 11.1 Optimierungen

```typescript
const performanceGuidelines = {
  // Lazy Loading
  images: 'loading="lazy"',
  components: 'React.lazy() für große Komponenten',
  
  // Code Splitting
  routes: 'Route-based code splitting',
  
  // Memoization
  expensiveCalculations: 'useMemo()',
  callbacks: 'useCallback()',
  components: 'React.memo()',
  
  // Bundle Size
  icons: 'Tree-shaking von lucide-react',
  tailwind: 'PurgeCSS in Production',
}
```

---

## 12. Design Tokens (Tailwind Config)

```typescript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5f7',
          100: '#bcd4de',
          200: '#a5ccd1',
          300: '#a0b9bf',
          400: '#9dacb2',
          500: '#949ba0',
          600: '#6b7378',
          700: '#4a5155',
          800: '#2d3235',
          900: '#1a1d1f',
        },
        background: {
          primary: '#fafbfc',
          secondary: '#f0f5f7',
          tertiary: '#e5edef',
        },
        // ... weitere Farben
      },
      
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      fontSize: {
        // Custom sizes for tabular numbers
      },
      
      spacing: {
        // Custom spacing scale
      },
      
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

---

## 13. Implementierungs-Roadmap

### Phase 1: Foundation (Woche 1-2)
- [ ] Tailwind Config mit Design Tokens
- [ ] Basis-Komponenten (Button, Input, Card)
- [ ] Typografie-System
- [ ] Farbpalette integrieren

### Phase 2: Components (Woche 3-4)
- [ ] Session Cards mit neuem Design
- [ ] Modal/Dialog-System
- [ ] Form Components
- [ ] Badge/Tag-System

### Phase 3: Data Visualization (Woche 5)
- [ ] Recharts mit neuen Farben
- [ ] Table-Komponenten
- [ ] Statistische Dashboards

### Phase 4: Polish & Accessibility (Woche 6)
- [ ] Animationen
- [ ] Accessibility Audit
- [ ] Performance-Optimierung
- [ ] Responsive Testing

---

## 14. Style Guide für Entwickler

### 14.1 CSS-Struktur

```css
/* Reihenfolge der Tailwind-Klassen */
.component {
  /* Layout */
  display flex
  flex-direction
  justify-content
  align-items
  gap
  
  /* Spacing */
  padding
  margin
  
  /* Sizing */
  width
  height
  min-width
  max-width
  
  /* Typography */
  font-family
  font-size
  font-weight
  line-height
  letter-spacing
  
  /* Colors */
  color
  background-color
  border-color
  
  /* Borders */
  border-width
  border-style
  border-radius
  
  /* Effects */
  box-shadow
  opacity
  
  /* Transitions */
  transition
  
  /* States (hover, focus, active) */
}
```

### 14.2 Naming Conventions

```typescript
// Komponentendateien: PascalCase
SessionEditor.tsx
WeeklyPlan.tsx

// Utility-Dateien: camelCase
calculateWeeklyKm.ts
paceCalculator.ts

// Konstanten: SCREAMING_SNAKE_CASE
const MAX_WEEKLY_DISTANCE = 100;

// Props: Descriptive + Type
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  onClick: () => void;
}
```

---

## 15. Testing & Quality Assurance

### 15.1 Visual Regression Testing

```typescript
// Screenshot-Tests für kritische UI-Komponenten
const visualTests = [
  'SessionCard - alle Session Types',
  'WeeklyChart - verschiedene Datenmengen',
  'Modal - geöffnet/geschlossen',
  'Forms - verschiedene States',
]
```

### 15.2 Accessibility Testing

```bash
# Tools
- axe DevTools
- WAVE Browser Extension
- Lighthouse Accessibility Audit
- Screen Reader Testing (NVDA, VoiceOver)
```

### 15.3 Cross-Browser Testing

```
- Chrome (aktuell)
- Firefox (aktuell)
- Safari (aktuell)
- Edge (aktuell)
- Mobile Safari (iOS 15+)
- Chrome Mobile (Android 11+)
```

---

## Anhang: Ressourcen

### Design-Tools
- Figma (für Prototyping)
- Coolors.co (Farbpaletten-Generator)
- Type Scale (Typografie-Scale-Generator)

### Code-Ressourcen
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [Recharts Docs](https://recharts.org)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Inspiration
- Strava (Sport-App-Design)
- TrainingPeaks (Trainingsplanung)
- Apple Health (Datenvisualisierung)
- Linear (Moderne B2B-UI)