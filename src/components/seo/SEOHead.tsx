import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  structuredData?: object;
  noIndex?: boolean;
  alternateUrls?: { lang: string; url: string }[];
}

const SITE_NAME = 'zenit-it';
const DEFAULT_OG_IMAGE = '/og-image.png';
const BASE_URL = 'https://zenit-it.com';

export function SEOHead({
  title,
  description,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  structuredData,
  noIndex = false,
  alternateUrls,
}: SEOHeadProps) {
  const { i18n } = useTranslation();
  const fullTitle = `${title} | ${SITE_NAME}`;
  const fullCanonical = canonicalUrl ? `${BASE_URL}${canonicalUrl}` : undefined;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${BASE_URL}${ogImage}`;

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical */}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:locale" content={i18n.language === 'de' ? 'de_DE' : 'en_US'} />
      {fullCanonical && <meta property="og:url" content={fullCanonical} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* Alternate Languages */}
      {alternateUrls?.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={`${BASE_URL}${url}`} />
      ))}

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
