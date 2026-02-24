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

          {/* 1. Überblick */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Datenschutz auf einen Blick</h2>
            <h3 className="font-medium text-slate-800 mb-2">Allgemeine Hinweise</h3>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
              personenbezogenen Daten passiert, wenn Sie unsere Website besuchen. Personenbezogene
              Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>
            <h3 className="font-medium text-slate-800 mt-4 mb-2">Analyse-Tools</h3>
            <p>
              Beim Besuch unserer Website wird Ihr Surf-Verhalten anonymisiert statistisch ausgewertet.
              Dies geschieht mit Plausible Analytics — einem datenschutzfreundlichen Tool ohne Cookies
              und ohne Erfassung personenbezogener Daten. Eine Zuordnung zu Ihrer Person ist nicht möglich.
            </p>
          </section>

          {/* 2. Allgemeine Hinweise */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Allgemeine Hinweise und Pflichtinformationen</h2>

            <h3 className="font-medium text-slate-800 mb-2">Datenschutz</h3>
            <p>
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir
              behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen
              Datenschutzvorschriften (DSGVO, DSG Österreich) sowie dieser Datenschutzerklärung.
            </p>
            <p className="mt-3">
              Wir weisen darauf hin, dass die Datenübertragung im Internet Sicherheitslücken aufweisen
              kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
            </p>

            <h3 className="font-medium text-slate-800 mt-4 mb-2">Verantwortliche Stelle</h3>
            <p>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-1">
              <p className="font-medium">zenit-it</p>
              <p>Johannes Kasser</p>
              <p>Herklotzgasse 10</p>
              <p>1150 Wien</p>
              <p>Österreich</p>
              <p className="pt-1">
                E-Mail:{' '}
                <a href="mailto:datenschutz@zenit-it.fit" className="text-blue-600 hover:underline">
                  datenschutz@zenit-it.fit
                </a>
              </p>
            </div>

            <h3 className="font-medium text-slate-800 mt-4 mb-2">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
            <p>
              Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich.
              Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine
              formlose Mitteilung per E-Mail an uns. Die Rechtmäßigkeit der bis zum Widerruf erfolgten
              Datenverarbeitung bleibt vom Widerruf unberührt.
            </p>

            <h3 className="font-medium text-slate-800 mt-4 mb-2">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
            <p>
              Im Falle datenschutzrechtlicher Verstöße steht Ihnen ein Beschwerderecht bei der
              zuständigen Aufsichtsbehörde zu. In Österreich ist dies die{' '}
              <strong>Datenschutzbehörde</strong> (DSB), Barichgasse 40–42, 1030 Wien,{' '}
              <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                www.dsb.gv.at
              </a>.
            </p>

            <h3 className="font-medium text-slate-800 mt-4 mb-2">Recht auf Datenübertragbarkeit</h3>
            <p>
              Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung
              eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen,
              maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte Übertragung der
              Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch
              machbar ist.
            </p>

            <h3 className="font-medium text-slate-800 mt-4 mb-2">SSL/TLS-Verschlüsselung</h3>
            <p>
              Diese Seite nutzt aus Sicherheitsgründen eine SSL/TLS-Verschlüsselung. Eine verschlüsselte
              Verbindung erkennen Sie am <strong>https://</strong> in der Adresszeile und dem
              Schloss-Symbol im Browser. Wenn die Verschlüsselung aktiviert ist, können Daten, die
              Sie an uns übermitteln, nicht von Dritten mitgelesen werden.
            </p>

            <h3 className="font-medium text-slate-800 mt-4 mb-2">Auskunft, Sperrung, Löschung</h3>
            <p>
              Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf
              unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft
              und Empfänger und den Zweck der Datenverarbeitung sowie ggf. ein Recht auf Berichtigung,
              Sperrung oder Löschung dieser Daten. Hierzu können Sie sich jederzeit unter der im
              Impressum angegebenen Adresse an uns wenden.
            </p>

            <h3 className="font-medium text-slate-800 mt-4 mb-2">Widerspruch gegen Werbe-E-Mails</h3>
            <p>
              Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur
              Übersendung von nicht ausdrücklich angeforderter Werbung wird hiermit widersprochen.
              Wir behalten uns rechtliche Schritte im Falle der unverlangten Zusendung von
              Werbeinformationen vor.
            </p>
          </section>

          {/* 3. Datenerfassung */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Datenerfassung auf unserer Website</h2>

            <h3 className="font-medium text-slate-800 mb-2">Cookies</h3>
            <p>
              Diese Website verwendet keine Tracking-Cookies. Es wird ausschließlich ein technisch
              notwendiges Session-Token für die Authentifizierung gesetzt, das für den Betrieb der
              App unbedingt erforderlich ist. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO
              (berechtigtes Interesse am sicheren Betrieb des Dienstes).
            </p>

            <h3 className="font-medium text-slate-800 mt-4 mb-2">Server-Log-Dateien</h3>
            <p>
              Der Provider der Seiten erhebt und speichert automatisch Informationen in
              Server-Log-Dateien, die Ihr Browser automatisch übermittelt:
            </p>
            <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
              <li>Browsertyp und Browserversion</li>
              <li>verwendetes Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Hostname des zugreifenden Rechners</li>
              <li>Uhrzeit der Serveranfrage</li>
              <li>IP-Adresse (anonymisiert)</li>
            </ul>
            <p className="mt-3">
              Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
            </p>
          </section>

          {/* 4. Hosting */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Hosting & Infrastruktur</h2>
            <p>
              Diese Website und alle damit verbundenen Dienste werden ausschließlich auf Servern
              innerhalb der Europäischen Union betrieben. Wir verwenden{' '}
              <strong>IONOS VPS-Server</strong> mit Standort in Europa für das Hosting unserer
              Anwendung und Datenbank.
            </p>
            <p className="mt-3">
              <strong>Deine Daten verlassen zu keinem Zeitpunkt die EU.</strong> Wir treffen
              keine Vereinbarungen zur Datenübertragung in Drittländer.
            </p>
            <p className="mt-3">
              Gespeicherte Daten umfassen: E-Mail-Adresse, Profilinformationen (Name, Laufniveau,
              optionale Körperdaten) sowie Ihre selbst erstellten Trainingspläne.
            </p>
          </section>

          {/* 5. Registrierung */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Registrierung & Nutzerkonto</h2>
            <p>
              Für die Nutzung dieser App ist eine Registrierung erforderlich. Wir erfassen dabei
              Ihre E-Mail-Adresse und ein selbst gewähltes Passwort. Diese Daten werden
              ausschließlich für die Bereitstellung des Dienstes verwendet.
            </p>
            <p className="mt-3">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
            </p>
          </section>

          {/* 6. Analytics */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Analytics (Plausible)</h2>
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
              Mehr Infos:{' '}
              <a href="https://plausible.io/data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                plausible.io/data-policy
              </a>
            </p>
            <p className="mt-3">
              Da keine personenbezogenen Daten erfasst werden, ist für den Einsatz von Plausible
              keine gesonderte Einwilligung erforderlich.
            </p>
          </section>

          {/* 7. Meta Pixel */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Meta Pixel (Zielgruppenaufbau)</h2>
            <p>
              Diese Website verwendet den <strong>Meta Pixel</strong> (Facebook Pixel) der
              Meta Platforms Ireland Limited, 4 Grand Canal Square, Dublin 2, Irland.
              Damit können wir zukünftig gezielt Werbung an Menschen schalten, die bereits
              Interesse an unserer App gezeigt haben (Custom Audiences). Aktuell schalten wir
              keine Werbeanzeigen — der Pixel dient ausschließlich dem Aufbau einer Zielgruppe
              für eventuelle zukünftige Kampagnen.
            </p>
            <p className="mt-3">
              Der Meta Pixel erfasst dabei ausschließlich anonymisierte Ereignisse
              (z.B. „Registrierung abgeschlossen") — <strong>keine Trainingspläne oder
              Gesundheitsdaten werden an Meta übermittelt</strong>.
            </p>
            <p className="mt-3">
              Die von Facebook erhobenen Daten können von Facebook gespeichert und verarbeitet
              werden, sodass eine Verbindung zum jeweiligen Nutzerprofil möglich ist. Die
              Datenübertragung in die USA wird auf die Standardvertragsklauseln der EU-Kommission
              gestützt. Details:{' '}
              <a href="https://www.facebook.com/legal/EU_data_transfer_addendum" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                facebook.com/legal/EU_data_transfer_addendum
              </a>
            </p>
            <p className="mt-3">
              Widerspruch: Sie können die Datenerhebung durch Meta Pixel unter{' '}
              <a href="https://www.facebook.com/privacy/explanation" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                facebook.com/privacy
              </a>{' '}
              widersprechen oder Ihr Konto entsprechend konfigurieren.
            </p>
            <p className="mt-3">
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am Marketing)
            </p>
          </section>

          {/* 8. Kein Datenverkauf */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Kein Verkauf Ihrer Daten</h2>
            <p>
              <strong>Wir verkaufen Ihre Daten nicht.</strong> Ihre Trainingspläne,
              E-Mail-Adresse und Profildaten werden nicht an Dritte weitergegeben,
              verkauft oder zu Werbezwecken genutzt — außer im Rahmen des unter
              Abschnitt 7 beschriebenen Meta Pixels.
            </p>
          </section>

          {/* 9. Speicherdauer */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Speicherdauer</h2>
            <p>
              Ihre Daten werden so lange gespeichert, wie Ihr Nutzerkonto aktiv ist.
              Nach Löschung Ihres Kontos werden alle personenbezogenen Daten innerhalb
              von 30 Tagen unwiderruflich gelöscht. Daten, deren Aufbewahrung aufgrund
              gesetzlicher Vorschriften vorgeschrieben ist, bleiben davon unberührt.
            </p>
          </section>

          {/* 10. Ihre Rechte */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Ihre Rechte (DSGVO)</h2>
            <p>Sie haben das Recht auf:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li><strong>Auskunft</strong> (Art. 15 DSGVO): Welche Daten wir über Sie gespeichert haben</li>
              <li><strong>Berichtigung</strong> (Art. 16 DSGVO): Korrektur falscher Daten</li>
              <li><strong>Löschung</strong> (Art. 17 DSGVO): Löschung Ihres Kontos und aller Daten</li>
              <li><strong>Einschränkung</strong> (Art. 18 DSGVO): Eingeschränkte Verarbeitung</li>
              <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO): Export Ihrer Daten</li>
              <li><strong>Widerspruch</strong> (Art. 21 DSGVO): Widerspruch gegen bestimmte Verarbeitungen</li>
            </ul>
            <p className="mt-3">
              Zur Ausübung dieser Rechte oder bei Fragen zum Datenschutz wenden Sie sich an:{' '}
              <a href="mailto:datenschutz@zenit-it.fit" className="text-blue-600 hover:underline">
                datenschutz@zenit-it.fit
              </a>
            </p>
            <p className="mt-3">
              Sie haben außerdem das Recht, eine Beschwerde bei der zuständigen
              Datenschutz-Aufsichtsbehörde einzureichen (in Österreich: Datenschutzbehörde,{' '}
              <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                www.dsb.gv.at
              </a>).
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
