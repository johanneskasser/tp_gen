/**
 * EditorManifestoSection
 *
 * Aesthetik: Rohes Editorial — schwarze Druckseite meets Running-Kultur.
 * Dicke Typografie, harte Kontraste, ehrliche Sprache.
 * "Kein AI-Bloat. Kein Generator. Ein Werkzeug für Menschen."
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X, Check } from 'lucide-react';
import { analytics } from '../../utils/analytics';

const rejects = [
  'Von ChatGPT generierte 08/15-Pläne',
  'Bezahlschranken für Grundfunktionen',
  'Plattformen die deine Daten als Produkt sehen',
  'Algorithmen die dir nicht erklären warum',
  'Formate die dich einsperren',
];

const believes = [
  'Du weißt selbst am besten wie sich dein Körper anfühlt',
  'Ein Plan den du verstehst ist besser als einer den du blindlings läufst',
  'Pace- und VDOT-Berechnungen helfen — aber ersetzen kein Gefühl',
  'Pläne von echten Läufern sind wertvoller als KI-Output',
  'Deine Daten gehören dir — nicht uns',
];

const philosophyPoints = [
  {
    number: '01',
    title: 'Aus einer Excel-Liste entstanden',
    body: 'Ich habe diesen Editor ursprünglich für mich selbst gebaut — um meine eigenen Trainingspläne aus Excel in eine klare, strukturierte Oberfläche zu bringen. Mehr nicht.',
  },
  {
    number: '02',
    title: 'Unterstützung, nicht Übernahme',
    body: 'Pace-Zonen, VDOT, Intensitätsverteilung — das sind Hilfsmittel. Du bekommst Orientierung, aber du entscheidest was in deinen Plan kommt. Kein Plan wird für dich generiert.',
  },
  {
    number: '03',
    title: 'Echte Pläne, echte Läufer',
    body: 'Im Marktplatz findest du Pläne die Menschen wirklich gelaufen sind. Kein ChatGPT-Output, keine Vorlage. Anschauen, klonen, anpassen — so funktioniert das hier.',
  },
];

export function EditorManifestoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-slate-50 overflow-hidden relative" id="manifesto">
      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-slate-200 via-blue-200 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">

        {/* Opening manifesto statement */}
        <div
          className={`mb-20 md:mb-28 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-block mb-6">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">
              Unsere Überzeugung
            </span>
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-slate-900 leading-[0.95] mb-8 max-w-5xl">
            Kein Generator.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-700">
              Ein Werkzeug.
            </span>
          </h2>
          <p className="font-body text-slate-500 text-lg sm:text-xl max-w-2xl leading-relaxed">
            Ich habe diesen Editor gebaut um meine eigenen Trainingspläne aus Excel
            in eine strukturierte, einfache Weboberfläche zu bringen. Man wird von
            Pace- und Intensitätsberechnungen unterstützt — aber nicht überwältigt.
          </p>
        </div>

        {/* Two-column: Rejects vs Believes */}
        <div className="grid lg:grid-cols-2 gap-0 mb-24 md:mb-32 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Left — What we reject */}
          <div
            className={`bg-white p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-slate-200 transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <div className="flex items-center gap-2 mb-8">
              <div className="w-6 h-6 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                <X size={12} className="text-red-500" strokeWidth={3} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-red-500">
                Was wir ablehnen
              </span>
            </div>
            <div className="space-y-4">
              {rejects.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ transitionDelay: `${300 + i * 80}ms` }}
                >
                  <X size={16} className="text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-slate-400 text-sm sm:text-base line-through decoration-red-300/60">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — What we believe */}
          <div
            className={`bg-slate-50/80 p-8 md:p-12 transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            <div className="flex items-center gap-2 mb-8">
              <div className="w-6 h-6 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                <Check size={12} className="text-green-600" strokeWidth={3} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-green-700">
                Woran wir glauben
              </span>
            </div>
            <div className="space-y-4">
              {believes.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                  }`}
                  style={{ transitionDelay: `${400 + i * 80}ms` }}
                >
                  <Check size={16} className="text-green-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-slate-700 text-sm sm:text-base font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Philosophy three pillars */}
        <div
          className={`mb-20 transition-all duration-700 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">
              Die drei Prinzipien
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {philosophyPoints.map((point, i) => (
              <div
                key={point.number}
                className={`bg-white p-8 md:p-10 transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${600 + i * 100}ms` }}
              >
                <div className="font-mono text-5xl font-black text-slate-300 mb-4 leading-none select-none">
                  {point.number}
                </div>
                <div className="h-0.5 w-8 bg-blue-500 mb-5" />
                <h3 className="font-display font-bold text-slate-900 text-lg mb-3">
                  {point.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{point.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className={`text-center transition-all duration-700 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-slate-400 text-sm mb-6 uppercase tracking-widest">
            Überzeug dich selbst — kein Account nötig
          </p>
          <Link
            to="/editor"
            onClick={() => analytics.trackManifestoCTAClicked()}
            className="inline-flex items-center gap-3 bg-slate-900 text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-slate-800 transition-colors group shadow-lg"
          >
            Editor öffnen
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
    </section>
  );
}
