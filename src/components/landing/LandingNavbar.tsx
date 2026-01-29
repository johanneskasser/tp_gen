import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe } from 'lucide-react';
import { Button } from '../ui';

export function LandingNavbar() {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
      setIsMobileMenuOpen(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'de' ? 'en' : 'de';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-lg shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center"
          >
            <img
              src="/zenit-it_long_black.png"
              alt="zenit-it"
              className="h-8 md:h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/marketplace"
              className="text-text-secondary hover:text-text-primary font-body font-medium transition-colors"
            >
              {t('navigation.marketplace')}
            </Link>
            <button
              onClick={() => scrollToSection('features')}
              className="text-text-secondary hover:text-text-primary font-body font-medium transition-colors"
            >
              {t('landing.nav.features')}
            </button>
            <button
              onClick={() => scrollToSection('roadmap')}
              className="text-text-secondary hover:text-text-primary font-body font-medium transition-colors"
            >
              {t('landing.nav.roadmap')}
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 text-text-secondary hover:text-text-primary font-body font-medium transition-colors"
              aria-label="Switch language"
            >
              <Globe size={18} />
              <span className="text-sm uppercase">{i18n.language}</span>
            </button>

            <Link to="/login" className="text-text-secondary hover:text-text-primary font-body font-medium transition-colors">
              {t('landing.nav.login')}
            </Link>

            <Link to="/login">
              <Button variant="default" size="default">
                {t('landing.nav.getStarted')}
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            {/* Mobile Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Switch language"
            >
              <Globe size={18} />
              <span className="text-sm uppercase font-medium">{i18n.language}</span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-text-primary hover:text-primary-600 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-border-light shadow-lg">
          <div className="px-4 py-4 space-y-3">
            <Link
              to="/marketplace"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-background-secondary rounded-lg font-body font-medium transition-colors"
            >
              {t('navigation.marketplace')}
            </Link>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-background-secondary rounded-lg font-body font-medium transition-colors"
            >
              {t('landing.nav.features')}
            </button>
            <button
              onClick={() => scrollToSection('roadmap')}
              className="block w-full text-left px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-background-secondary rounded-lg font-body font-medium transition-colors"
            >
              {t('landing.nav.roadmap')}
            </button>
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-background-secondary rounded-lg font-body font-medium transition-colors"
            >
              {t('landing.nav.login')}
            </Link>
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block">
              <Button variant="default" size="default" className="w-full">
                {t('landing.nav.getStarted')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
