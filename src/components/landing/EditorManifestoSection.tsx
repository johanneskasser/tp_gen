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
  'ChatGPT-generierte Standardpläne',
  'Abonnements für Basisfeatures',
  'Daten verkaufen als Geschäftsmodell',
  'Algorithmen statt Erfahrung',
  'Vendor Lock-in & proprietäre Formate',
];

const believes = [
  'Du kennst deinen Körper besser als jede KI',
  'Ein guter Plan entsteht durch Nachdenken, nicht Klicken',
  'Erfahrungswissen von Läufern ist Gold wert',
  'Open Source schafft Vertrauen — nicht Marketing',
  'Deine Daten gehören dir, immer',
];

const philosophyPoints = [
  {
    number: '01',
    title: 'Human in the Loop',
    body: 'Der Editor macht Vorschläge — VDOT, Pace-Zonen, Intensitätsverteilung. Du entscheidest. Kein Plan verlässt den Editor ohne deine Hand.',
  },
  {
    number: '02',
    title: 'Kein Generator',
    body: 'Wir generieren keine Trainingspläne. Wir geben dir das Handwerk. Intervall-Struktur, Wochenaufbau, Tapering — du baust, wir helfen.',
  },
  {
    number: '03',
    title: 'Community > Algorithmus',
    body: 'Ein Plan, den ein Mensch wirklich gelaufen ist und geteilt hat, ist wertvoller als tausend KI-Outputs. Deshalb gibt es den Marktplatz.',
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
    <section ref={sectionRef} className="bg-slate-950 overflow-hidden relative" id="manifesto">
      {/* Decorative grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Top accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-400 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">

        {/* Opening manifesto statement */}
        <div
          className={`mb-20 md:mb-28 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-block mb-6">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">
              Unsere Überzeugung
            </span>
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] mb-8 max-w-5xl">
            Wir glauben nicht<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              an KI-generierte
            </span><br />
            Trainingspläne.
          </h2>
          <p className="font-body text-slate-400 text-lg sm:text-xl max-w-2xl leading-relaxed">
            Stattdessen bauen wir einen Editor für Läufer, die ihre Pläne selbst
            verstehen und gestalten wollen. Mit wissenschaftlichen Werkzeugen —
            aber immer dem Menschen am Steuer.
          </p>
        </div>

        {/* Two-column: Rejects vs Believes */}
        <div className="grid lg:grid-cols-2 gap-0 mb-24 md:mb-32 border border-white/5 rounded-2xl overflow-hidden">
          {/* Left — What we reject */}
          <div
            className={`bg-white/[0.02] p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-white/5 transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <div className="flex items-center gap-2 mb-8">
              <div className="w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <X size={12} className="text-red-500" strokeWidth={3} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-red-500/70">
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
                  <X size={16} className="text-red-500/50 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-slate-400 text-sm sm:text-base line-through decoration-red-500/30">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — What we believe */}
          <div
            className={`bg-white/[0.03] p-8 md:p-12 transition-all duration-700 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            <div className="flex items-center gap-2 mb-8">
              <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Check size={12} className="text-green-400" strokeWidth={3} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-green-400/70">
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
                  <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-white/80 text-sm sm:text-base font-medium">{item}</span>
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
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
              Die drei Prinzipien
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {philosophyPoints.map((point, i) => (
              <div
                key={point.number}
                className={`bg-slate-950 p-8 md:p-10 transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${600 + i * 100}ms` }}
              >
                <div className="font-mono text-5xl font-black text-white/5 mb-4 leading-none select-none">
                  {point.number}
                </div>
                <div className="h-px w-8 bg-blue-500 mb-5" />
                <h3 className="font-display font-bold text-white text-lg mb-3">
                  {point.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">{point.body}</p>
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
          <p className="text-slate-500 text-sm mb-6 uppercase tracking-widest">
            Überzeug dich selbst — kein Account nötig
          </p>
          <Link
            to="/editor"
            onClick={() => analytics.trackManifestoCTAClicked()}
            className="inline-flex items-center gap-3 bg-white text-slate-900 font-bold text-lg px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors group shadow-2xl"
          >
            Editor öffnen
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </section>
  );
}
