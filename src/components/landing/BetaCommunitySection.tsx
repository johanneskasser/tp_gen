import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquarePlus, Coins, Users } from 'lucide-react';

interface ValuePropProps {
  icon: React.ReactNode;
  title: string;
  body: string;
  delay: number;
  isVisible: boolean;
}

function ValueProp({ icon, title, body, delay, isVisible }: ValuePropProps) {
  return (
    <div
      className={`flex flex-col gap-4 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
        {icon}
      </div>
      <div>
        <h3 className="font-display font-bold text-xl text-white mb-2">{title}</h3>
        <p className="font-body text-white/70 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export function BetaCommunitySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setIsVisible(true);
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  const props: ValuePropProps[] = [
    {
      icon: <Coins size={22} />,
      title: 'Kostenlos — und bleibt es',
      body: 'Der Trainingsplan-Generator ist und bleibt kostenlos. Kein Abo, kein Paywall. Künftig kommt ein Marketplace, auf dem Läufer ihre Pläne für faire Preise teilen können — die App selbst bleibt gratis.',
      delay: 100,
      isVisible,
    },
    {
      icon: <MessageSquarePlus size={22} />,
      title: 'Dein Feedback zählt',
      body: 'Du bist früh dabei. Dein direktes Feedback beeinflusst, welche Features wir als nächstes bauen und wie die App sich anfühlt.',
      delay: 250,
      isVisible,
    },
    {
      icon: <Users size={22} />,
      title: 'Teil der ersten Community',
      body: 'Frühe User prägen mit, wie die App wird. Wir hören zu, reagieren schnell und bauen das hier gemeinsam.',
      delay: 400,
      isVisible,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 relative overflow-hidden"
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='1' height='32' fill='white'/%3E%3Crect x='0' y='0' width='32' height='1' fill='white'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Glow blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`mb-16 md:mb-20 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 mb-6">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="font-body text-sm font-semibold text-yellow-300 tracking-wide uppercase">
              Öffentliche Beta
            </span>
          </div>
          <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-white leading-tight max-w-2xl">
            Du bist früh dabei.
            <br />
            <span className="text-white/50">Das ist ein Vorteil.</span>
          </h2>
        </div>

        {/* Value Props Grid */}
        <div className="grid md:grid-cols-3 gap-10 md:gap-16 mb-14">
          {props.map((p) => (
            <ValueProp key={p.title} {...p} />
          ))}
        </div>

        {/* CTA */}
        <div
          className={`transition-all duration-700 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Link
            to="/feedback"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-body font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-lg"
          >
            <MessageSquarePlus size={18} />
            Feedback geben
          </Link>
        </div>
      </div>
    </section>
  );
}
