export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-700 mb-6 inline-block">
            ← Zurück zur Startseite
          </a>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Impressum</h1>
          <p className="text-slate-500 text-sm">Angaben gemäß § 5 ECG (Österreich)</p>
        </div>

        <div className="space-y-8 text-slate-700">

          {/* Angaben zum Unternehmen */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Angaben zum Unternehmen</h2>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-1">
              <p className="font-medium">zenit-it</p>
              <p>Johannes Kasser</p>
              <p>Herklotzgasse 10</p>
              <p>1150 Wien</p>
              <p>Österreich</p>
            </div>
          </section>

          {/* Kontakt */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Kontakt</h2>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm space-y-2">
              <p>
                <span className="font-medium">E-Mail:</span>{' '}
                <a href="mailto:support@zenit-it.fit" className="text-blue-600 hover:underline">
                  support@zenit-it.fit
                </a>
              </p>
              <p>
                <span className="font-medium">Telefon:</span>{' '}
                <a href="tel:+436765760078" className="text-blue-600 hover:underline">
                  +43 676 5760078
                </a>
              </p>
            </div>
          </section>

          {/* Umsatzsteuer */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Umsatzsteuer</h2>
            <p>
              Als Kleinunternehmer im Sinne der österreichischen Umsatzsteuergesetzgebung
              (§ 6 Abs. 1 Z 27 UStG) wird keine Umsatzsteuer ausgewiesen und ist daher
              keine Umsatzsteuer-Identifikationsnummer vorhanden.
            </p>
          </section>

          {/* Online-Streitbeilegung */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Online-Streitbeilegung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="mt-2">
              Unsere E-Mail-Adresse finden Sie oben im Impressum. Wir sind nicht verpflichtet,
              an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen,
              sind hierzu aber grundsätzlich bereit.
            </p>
          </section>

          {/* Haftung für Inhalte */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Haftung für Inhalte</h2>
            <p>
              Als Dienstanbieter sind wir gemäß § 17 ECG für eigene Inhalte auf diesen Seiten
              nach den allgemeinen Gesetzen verantwortlich. Als Dienstanbieter sind wir jedoch
              nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen
              oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p className="mt-3">
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
              allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
              erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
              Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </section>

          {/* Haftung für Links */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
              keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
              Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
              Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum
              Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte
              waren zum Zeitpunkt der Verlinkung nicht erkennbar.
            </p>
          </section>

          {/* Urheberrecht */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Urheberrecht</h2>
            <p>
              Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
              unterliegen dem österreichischen Urheberrecht. Die Vervielfältigung, Bearbeitung,
              Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
              bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
              Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen
              Gebrauch gestattet.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
