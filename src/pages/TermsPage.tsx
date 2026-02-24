export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-700 mb-6 inline-block">
            ← Zurück zur Startseite
          </a>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Allgemeine Geschäftsbedingungen</h1>
          <p className="text-slate-500 text-sm">Stand: Februar 2026</p>
        </div>

        <div className="space-y-8 text-slate-700">

          {/* 1. Geltungsbereich */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der
              Webanwendung <strong>Trainingsplan-Generator</strong> (im Folgenden „Dienst"),
              betrieben von:
            </p>
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-1">
              <p className="font-medium">zenit-it</p>
              <p>Johannes Kasser</p>
              <p>Herklotzgasse 10, 1150 Wien, Österreich</p>
              <p>
                E-Mail:{' '}
                <a href="mailto:support@zenit-it.fit" className="text-blue-600 hover:underline">
                  support@zenit-it.fit
                </a>
              </p>
            </div>
            <p className="mt-3">
              Mit der Registrierung und Nutzung des Dienstes erkennen Sie diese AGB an.
            </p>
          </section>

          {/* 2. Leistungsbeschreibung */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Leistungsbeschreibung</h2>
            <p>
              Der Trainingsplan-Generator ist eine webbasierte SaaS-Anwendung, die Nutzern
              ermöglicht, personalisierte Lauftrainingspläne zu erstellen, zu verwalten,
              zu exportieren und (optional) im Marketplace zu veröffentlichen.
            </p>
            <p className="mt-3">
              Der Dienst befindet sich in einer aktiven Entwicklungsphase (Beta). Der Betreiber
              behält sich vor, Funktionen jederzeit zu ändern, zu erweitern oder einzustellen.
              Es besteht kein Anspruch auf die dauerhafte Verfügbarkeit einzelner Funktionen.
            </p>
          </section>

          {/* 3. Registrierung */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Registrierung & Nutzerkonto</h2>
            <p>
              Für die Nutzung des Dienstes ist eine Registrierung erforderlich. Der Nutzer
              verpflichtet sich, bei der Registrierung wahrheitsgemäße Angaben zu machen und
              seine Zugangsdaten vertraulich zu behandeln.
            </p>
            <p className="mt-3">
              Der Betreiber behält sich das Recht vor, Konten bei Verstoß gegen diese AGB ohne
              vorherige Ankündigung zu sperren oder zu löschen.
            </p>
          </section>

          {/* 4. Nutzungsrechte */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Nutzungsrechte</h2>
            <p>
              Mit der Registrierung erhält der Nutzer ein nicht-exklusives, nicht übertragbares
              Recht zur Nutzung des Dienstes für private, nicht-kommerzielle Zwecke.
            </p>
            <p className="mt-3">
              Vom Nutzer erstellte Trainingspläne verbleiben im Eigentum des Nutzers. Der Nutzer
              räumt dem Betreiber das Recht ein, im Marketplace veröffentlichte Pläne anderen
              Nutzern zugänglich zu machen.
            </p>
          </section>

          {/* 5. Pflichten des Nutzers */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Pflichten des Nutzers</h2>
            <p>Der Nutzer verpflichtet sich:</p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li>den Dienst nicht für rechtswidrige Zwecke zu nutzen</li>
              <li>keine falschen, irreführenden oder schädlichen Inhalte zu veröffentlichen</li>
              <li>keine automatisierten Skripte oder Bots einzusetzen</li>
              <li>Zugangsdaten sicher aufzubewahren und nicht weiterzugeben</li>
              <li>Dritte nicht zu belästigen oder deren Rechte zu verletzen</li>
            </ul>
          </section>

          {/* 6. Verfügbarkeit */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Verfügbarkeit</h2>
            <p>
              Der Betreiber ist bemüht, den Dienst möglichst unterbrechungsfrei zur Verfügung
              zu stellen, übernimmt jedoch keine Garantie für eine bestimmte Verfügbarkeit.
              Wartungsarbeiten und vorübergehende Einschränkungen sind möglich.
            </p>
          </section>

          {/* 7. Haftung */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Haftungsbeschränkung</h2>
            <p>
              Der Dienst stellt keine medizinische oder sportmedizinische Beratung dar.
              Die generierten Trainingspläne sind allgemeine Empfehlungen und ersetzen nicht
              die Beratung durch einen qualifizierten Trainer oder Arzt. Der Nutzer handelt
              auf eigene Verantwortung.
            </p>
            <p className="mt-3">
              Der Betreiber haftet nicht für Schäden, die durch die Nutzung der generierten
              Trainingspläne entstehen, sofern kein Vorsatz oder grobe Fahrlässigkeit vorliegt.
            </p>
            <p className="mt-3">
              Für den Verlust von Daten haftet der Betreiber nur bei Vorsatz oder grober
              Fahrlässigkeit und auch dann nur in Höhe des Schadens, der bei regelmäßiger
              Datensicherung durch den Nutzer entstanden wäre. Der Nutzer wird empfohlen,
              erstellte Pläne regelmäßig als JSON-Export zu sichern.
            </p>
          </section>

          {/* 8. Kostenfreiheit & Beta */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Kostenfreiheit in der Beta-Phase</h2>
            <p>
              Der Dienst ist derzeit kostenlos nutzbar. Der Betreiber behält sich vor,
              zukünftig kostenpflichtige Tarife oder Premium-Funktionen einzuführen. Bestehende
              Nutzer werden hierüber rechtzeitig informiert.
            </p>
          </section>

          {/* 9. Kündigung */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Kündigung & Kontolöschung</h2>
            <p>
              Der Nutzer kann sein Konto jederzeit über die App-Einstellungen oder per
              E-Mail an{' '}
              <a href="mailto:support@zenit-it.fit" className="text-blue-600 hover:underline">
                support@zenit-it.fit
              </a>{' '}
              löschen lassen. Nach der Löschung werden alle personenbezogenen Daten innerhalb
              von 30 Tagen entfernt.
            </p>
            <p className="mt-3">
              Der Betreiber kann den Dienst oder einzelne Nutzerkonten mit einer Frist von
              30 Tagen kündigen, es sei denn, ein wichtiger Grund (z.B. Verstoß gegen diese AGB)
              erfordert eine sofortige Kündigung.
            </p>
          </section>

          {/* 10. Änderungen */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Änderungen der AGB</h2>
            <p>
              Der Betreiber behält sich vor, diese AGB bei sachlich gerechtfertigten Gründen
              (z.B. Gesetzesänderungen, neue Funktionen) zu ändern. Nutzer werden über
              wesentliche Änderungen per E-Mail informiert. Die fortgesetzte Nutzung des
              Dienstes nach Inkrafttreten der Änderungen gilt als Zustimmung.
            </p>
          </section>

          {/* 11. Anwendbares Recht */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Anwendbares Recht & Gerichtsstand</h2>
            <p>
              Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts.
              Gerichtsstand für Streitigkeiten mit Unternehmern ist Wien. Für Verbraucher
              gelten die gesetzlichen Zuständigkeitsregelungen.
            </p>
          </section>

          {/* 12. Salvatorische Klausel */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">12. Salvatorische Klausel</h2>
            <p>
              Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt
              die Wirksamkeit der übrigen Bestimmungen davon unberührt. Die unwirksame
              Bestimmung wird durch eine wirksame Regelung ersetzt, die dem wirtschaftlichen
              Zweck der unwirksamen Bestimmung am nächsten kommt.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
