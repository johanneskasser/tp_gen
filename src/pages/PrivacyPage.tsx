export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-700 mb-6 inline-block">
            ← Zurück zur Startseite
          </a>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Datenschutzerklärung</h1>
          <p className="text-slate-500 text-sm">Stand: Februar 2026</p>
        </div>

        <div className="max-w-none space-y-8 text-slate-700">

          {/* 1. Verantwortlicher */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Verantwortlicher</h2>
            <p>
              Verantwortlicher im Sinne der DSGVO für den Betrieb dieser Website ist:
            </p>
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm">
              <p>zenit-it</p>
              <p>[Vollständige Adresse]</p>
              <p>E-Mail: <a href="mailto:datenschutz@zenit-it.fit" className="text-blue-600 hover:underline">datenschutz@zenit-it.fit</a></p>
            </div>
          </section>

          {/* 2. Hosting & Server */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Hosting & Datenverarbeitung</h2>
            <p>
              Diese Website und alle damit verbundenen Dienste werden ausschließlich auf Servern
              innerhalb der Europäischen Union betrieben. Wir verwenden <strong>Supabase</strong>
              (selbst-gehostet auf Hetzner-Servern in Frankfurt, Deutschland) für Authentifizierung
              und Datenspeicherung.
            </p>
            <p className="mt-3">
              <strong>Deine Daten verlassen zu keinem Zeitpunkt die EU.</strong> Wir treffen
              keine Vereinbarungen zur Datenübertragung in Drittländer.
            </p>
            <p className="mt-3">
              Gespeicherte Daten umfassen: E-Mail-Adresse, Profilinformationen (Name, Laufniveau,
              optionale Körperdaten) sowie deine selbst erstellten Trainingspläne.
            </p>
          </section>

          {/* 3. Registrierung */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Registrierung & Nutzerkonto</h2>
            <p>
              Für die Nutzung dieser App ist eine Registrierung erforderlich. Wir erfassen dabei
              deine E-Mail-Adresse und ein selbst gewähltes Passwort. Diese Daten werden
              ausschließlich für die Bereitstellung des Dienstes verwendet.
            </p>
            <p className="mt-3">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
            </p>
          </section>

          {/* 4. Analytics */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Analytics (Plausible)</h2>
            <p>
              Wir verwenden <strong>Plausible Analytics</strong> — eine datenschutzfreundliche,
              Open-Source-Alternative zu Google Analytics. Plausible:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li>setzt <strong>keine Cookies</strong></li>
              <li>erstellt kein Fingerprinting</li>
              <li>speichert <strong>keine personenbezogenen Daten</strong></li>
              <li>ist selbst-gehostet auf unserem eigenen EU-Server (analytics.zenit-it.fit)</li>
              <li>entspricht vollständig der DSGVO, ePrivacy-Richtlinie, CCPA und PECR</li>
            </ul>
            <p className="mt-3">
              Plausible erfasst anonymisierte Nutzungsstatistiken: aufgerufene Seiten,
              verwendete Funktionen (z.B. Plan erstellt, Plan exportiert), Referrer-Domain,
              Gerätekategorie, grobe Länderinformation (kein genauer Standort).
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Mehr Infos: <a href="https://plausible.io/data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">plausible.io/data-policy</a>
            </p>
          </section>

          {/* 5. Meta Pixel */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Meta Pixel (Zielgruppenaufbau)</h2>
            <p>
              Diese Website verwendet den <strong>Meta Pixel</strong> (Facebook Pixel) der
              Meta Platforms Ireland Limited. Damit können wir zukünftig gezielt Werbung
              an Menschen schalten, die bereits Interesse an unserer App gezeigt haben
              (Custom Audiences). Aktuell schalten wir keine Werbeanzeigen — der Pixel
              dient ausschließlich dem Aufbau einer Zielgruppe für eventuelle zukünftige
              Kampagnen.
            </p>
            <p className="mt-3">
              Der Meta Pixel erfasst dabei ausschließlich anonymisierte Ereignisse
              (z.B. "Registrierung abgeschlossen") — <strong>keine Trainingspläne oder
              Gesundheitsdaten werden an Meta übermittelt</strong>.
            </p>
            <p className="mt-3">
              Du kannst die Datenerhebung durch Meta Pixel unter{' '}
              <a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                facebook.com/privacy
              </a>{' '}
              widersprechen oder dein Konto entsprechend konfigurieren.
            </p>
            <p className="mt-3">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am Marketing)
            </p>
          </section>

          {/* 6. Kein Datenverkauf */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Kein Verkauf deiner Daten</h2>
            <p>
              <strong>Wir verkaufen deine Daten nicht.</strong> Deine Trainingspläne,
              E-Mail-Adresse und Profildaten werden nicht an Dritte weitergegeben,
              verkauft oder zu Werbezwecken genutzt — außer im Rahmen des unter
              Abschnitt 5 beschriebenen Meta Pixels.
            </p>
          </section>

          {/* 7. Speicherdauer */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Speicherdauer</h2>
            <p>
              Deine Daten werden so lange gespeichert, wie dein Nutzerkonto aktiv ist.
              Nach Löschung deines Kontos werden alle personenbezogenen Daten innerhalb
              von 30 Tagen unwiderruflich gelöscht.
            </p>
          </section>

          {/* 8. Deine Rechte */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Deine Rechte (DSGVO)</h2>
            <p>Du hast das Recht auf:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li><strong>Auskunft</strong> (Art. 15 DSGVO): Welche Daten wir über dich gespeichert haben</li>
              <li><strong>Berichtigung</strong> (Art. 16 DSGVO): Korrektur falscher Daten</li>
              <li><strong>Löschung</strong> (Art. 17 DSGVO): Löschung deines Kontos und aller Daten</li>
              <li><strong>Einschränkung</strong> (Art. 18 DSGVO): Eingeschränkte Verarbeitung</li>
              <li><strong>Widerspruch</strong> (Art. 21 DSGVO): Widerspruch gegen bestimmte Verarbeitungen</li>
            </ul>
            <p className="mt-3">
              Zur Ausübung dieser Rechte oder bei Fragen zum Datenschutz wende dich an:{' '}
              <a href="mailto:datenschutz@zenit-it.fit" className="text-blue-600 hover:underline">
                datenschutz@zenit-it.fit
              </a>
            </p>
            <p className="mt-3">
              Du hast außerdem das Recht, eine Beschwerde bei der zuständigen Datenschutz-
              Aufsichtsbehörde einzureichen.
            </p>
          </section>

          {/* 9. Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Cookies</h2>
            <p>
              Diese Website verwendet keine Tracking-Cookies. Es wird ausschließlich ein
              technisch notwendiges Session-Token für die Authentifizierung (Supabase) gesetzt,
              das für den Betrieb der App unbedingt erforderlich ist.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
