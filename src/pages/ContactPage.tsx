import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <a href="/" className="text-sm text-slate-500 hover:text-slate-700 mb-6 inline-block">
            ← Zurück zur Startseite
          </a>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Kontakt</h1>
          <p className="text-slate-500 text-sm">Wir freuen uns über deine Nachricht.</p>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">zenit-it · Johannes Kasser</h2>

            <div className="space-y-4">
              <a
                href="mailto:support@zenit-it.fit"
                className="flex items-center gap-3 text-slate-700 hover:text-blue-600 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">E-Mail</p>
                  <p className="font-medium">support@zenit-it.fit</p>
                </div>
              </a>

              <a
                href="tel:+436765760078"
                className="flex items-center gap-3 text-slate-700 hover:text-blue-600 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Telefon</p>
                  <p className="font-medium">+43 676 5760078</p>
                </div>
              </a>

              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Adresse</p>
                  <p className="font-medium">Herklotzgasse 10, 1150 Wien, Österreich</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
            <strong>Feedback & Bug-Reports:</strong> Du kannst uns auch direkt über das{' '}
            <a href="/feedback" className="underline hover:text-blue-600">
              Feedback-Formular
            </a>{' '}
            in der App erreichen, oder ein Issue auf{' '}
            <a
              href="https://github.com/johanneskasser/tp_gen"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-600"
            >
              GitHub
            </a>{' '}
            öffnen.
          </div>
        </div>
      </div>
    </div>
  );
}
