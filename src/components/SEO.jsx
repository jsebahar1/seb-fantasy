import { useEffect } from 'react';
import { siteConfig } from '../data/siteConfig';

/**
 * Per-page SEO component. Manages document title, meta tags,
 * Open Graph, Twitter Card, canonical URL, and injects a
 * page-specific JSON-LD structured-data block.
 *
 * Props:
 *   title          — page title (appended with "| SEB Fantasy")
 *   description    — meta description (aim for 150–160 chars)
 *   path           — URL path, e.g. "/blog/my-post"
 *   image          — path to OG image, e.g. "/Bracket.png"
 *   type           — og:type; "website" (default) or "article"
 *   publishedDate  — ISO date for article:published_time, e.g. "2026-03-15"
 *   keywords       — string[] of keywords
 */
export default function SEO({
  title,
  description,
  path = '',
  image,
  type = 'website',
  publishedDate,
  keywords,
}) {
  const fullTitle = title
    ? `${title} | ${siteConfig.name}`
    : `${siteConfig.name} — ${siteConfig.tagline}`;
  const fullDescription = description || siteConfig.description;
  const canonicalUrl = `${siteConfig.url}${path}`;
  const ogImage = image ? `${siteConfig.url}${image}` : `${siteConfig.url}${siteConfig.logo}`;

  useEffect(() => {
    // ── Title & core meta ──
    document.title = fullTitle;
    setMeta('description', fullDescription);
    setMeta('robots', 'index, follow');
    if (keywords?.length) setMeta('keywords', keywords.join(', '));

    // ── Open Graph ──
    setMeta('og:type', type, true);
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', fullDescription, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:image', ogImage, true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    setMeta('og:site_name', siteConfig.name, true);

    // ── Article-specific Open Graph ──
    if (type === 'article') {
      setMeta('og:author', siteConfig.author, true);
      if (publishedDate) {
        setMeta('article:published_time', publishedDate, true);
        setMeta('article:author', siteConfig.author, true);
        setMeta('article:section', 'Sports Analytics', true);
      }
      if (keywords?.length) setMeta('article:tag', keywords[0], true);
    }

    // ── Twitter Card ──
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', fullDescription);
    setMeta('twitter:image', ogImage);

    // ── Canonical ──
    setCanonical(canonicalUrl);

    // ── JSON-LD structured data ──
    if (type === 'article' && publishedDate) {
      setJsonLd({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: fullTitle,
        description: fullDescription,
        image: ogImage,
        datePublished: publishedDate,
        author: { '@type': 'Person', name: siteConfig.author, url: siteConfig.url },
        publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
        mainEntityOfPage: canonicalUrl,
        ...(keywords?.length && { keywords: keywords.join(', ') }),
      });
    } else {
      setJsonLd({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: fullTitle,
        description: fullDescription,
        url: canonicalUrl,
        isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url },
        author: { '@type': 'Person', name: siteConfig.author },
      });
    }
  }, [fullTitle, fullDescription, canonicalUrl, ogImage, type, publishedDate, keywords]);

  return null;
}

function setMeta(name, content, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setJsonLd(data) {
  let el = document.querySelector('script[data-seo-ld]');
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('data-seo-ld', 'true');
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}
