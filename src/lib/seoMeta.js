import { routeToHash } from './appRouter';

const SITE_NAME = 'Urban Jewells';
const DEFAULT_META_DESCRIPTION = 'Luxury jewellery with an editorial edge. Explore statement rings, necklaces, bracelets and gift-ready pieces from Urban Jewells.';
const DEFAULT_SOCIAL_IMAGE = 'https://res.cloudinary.com/dxw1yg7if/image/upload/v1774376772/Model_p0p9uk.jpg';

const ensureMetaTag = (selector, attributes) => {
  if (typeof document === 'undefined') return null;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) tag.setAttribute(key, String(value));
  });
  return tag;
};

const ensureLinkTag = (selector, attributes) => {
  if (typeof document === 'undefined') return null;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('link');
    document.head.appendChild(tag);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) tag.setAttribute(key, String(value));
  });
  return tag;
};

const buildAbsoluteUrl = (hashPath = '#/') => {
  if (typeof window === 'undefined') return hashPath;
  return `${window.location.origin}/${String(hashPath).startsWith('#') ? hashPath : `#${hashPath}`}`;
};

const titleCaseLabel = value => (value || '')
  .split(/[-_\s]+/)
  .filter(Boolean)
  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const truncateText = (text, max = 155) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}...`;
};

export const buildMetaForRoute = ({ page, params = {}, products = [], collections = [], categories = [] }) => {
  const base = {
    title: SITE_NAME,
    description: DEFAULT_META_DESCRIPTION,
    image: DEFAULT_SOCIAL_IMAGE,
    url: buildAbsoluteUrl(routeToHash(page, params)),
    type: 'website',
    robots: 'index,follow',
  };

  switch (page) {
    case 'home':
      return {
        ...base,
        title: `${SITE_NAME} | Luxury Jewellery with an Editorial Edge`,
        description: 'Shop elevated rings, necklaces, bracelets and gift-ready jewellery designed to feel luxurious, modern and personal.',
      };
    case 'all-pieces':
      return {
        ...base,
        title: `All Pieces | ${SITE_NAME}`,
        description: 'Browse the full Urban Jewells catalogue with filters for category, collection, price, stock and new arrivals.',
      };
    case 'collections':
      return {
        ...base,
        title: `Collections | ${SITE_NAME}`,
        description: 'Explore signature Urban Jewells collections curated around mood, styling and statement layering.',
      };
    case 'collection-detail': {
      const collection = collections.find(item => item.slug === params.slug);
      if (!collection) return { ...base, title: `Collection | ${SITE_NAME}` };
      return {
        ...base,
        title: `${collection.name} Collection | ${SITE_NAME}`,
        description: truncateText(collection.description || collection.mood || `Discover pieces from the ${collection.name} collection at ${SITE_NAME}.`),
        image: collection.coverImage || base.image,
      };
    }
    case 'categories':
      return {
        ...base,
        title: `Categories | ${SITE_NAME}`,
        description: 'Shop Urban Jewells by category, from rings and necklaces to bracelets, anklets and curated gift sets.',
      };
    case 'category': {
      const category = categories.find(item => item.slug === params.slug);
      if (!category) return { ...base, title: `Category | ${SITE_NAME}` };
      return {
        ...base,
        title: `${category.name} | ${SITE_NAME}`,
        description: truncateText(category.tagline || `Explore ${category.name.toLowerCase()} from ${SITE_NAME}.`),
        image: category.coverImage || base.image,
      };
    }
    case 'product': {
      const product = products.find(item => item.slug === params.slug);
      if (!product) return { ...base, title: `Product | ${SITE_NAME}`, type: 'product' };
      const categoryLabel = categories.find(item => item.slug === product.category)?.name || titleCaseLabel(product.category);
      const collectionLabel = collections.find(item => item.slug === product.collection)?.name || titleCaseLabel(product.collection);
      const summary = [
        product.shortDescription,
        categoryLabel ? `${categoryLabel} by ${SITE_NAME}.` : null,
        collectionLabel ? `From the ${collectionLabel} collection.` : null,
      ].filter(Boolean).join(' ');
      return {
        ...base,
        title: `${product.name} | ${SITE_NAME}`,
        description: truncateText(summary || `Shop ${product.name} at ${SITE_NAME}.`),
        image: product.images?.[0] || base.image,
        type: 'product',
      };
    }
    case 'about':
      return {
        ...base,
        title: `About Us | ${SITE_NAME}`,
        description: 'Learn about the craft, sourcing values and design approach behind Urban Jewells.',
      };
    case 'contact':
      return {
        ...base,
        title: `Contact Us | ${SITE_NAME}`,
        description: 'Get in touch with Urban Jewells for orders, custom requests, gifting questions and support.',
      };
    case 'wishlist':
      return {
        ...base,
        title: `Wishlist | ${SITE_NAME}`,
        description: 'Review the Urban Jewells pieces you have saved for later.',
      };
    case 'cart':
      return {
        ...base,
        title: `Cart | ${SITE_NAME}`,
        description: 'Review your Urban Jewells cart, shipping and checkout details.',
      };
    case 'privacy-policy':
      return {
        ...base,
        title: `Privacy Policy | ${SITE_NAME}`,
        description: 'Read how Urban Jewells handles customer information, communication and privacy.',
      };
    case 'shipping':
      return {
        ...base,
        title: `Shipping Policy | ${SITE_NAME}`,
        description: 'Review Urban Jewells shipping timelines, thresholds and dispatch expectations.',
      };
    case 'returns':
      return {
        ...base,
        title: `Returns Policy | ${SITE_NAME}`,
        description: 'Understand Urban Jewells returns, exchanges and refund guidelines before ordering.',
      };
    case 'terms':
      return {
        ...base,
        title: `Terms & Conditions | ${SITE_NAME}`,
        description: 'Read the terms governing purchases, orders and use of the Urban Jewells website.',
      };
    case 'admin':
      return {
        ...base,
        title: `Admin Portal | ${SITE_NAME}`,
        description: 'Protected Urban Jewells admin portal.',
        robots: 'noindex,nofollow',
      };
    default:
      return base;
  }
};

export const applyDocumentMeta = (meta, getOptimizedImageUrl) => {
  if (typeof document === 'undefined') return;

  document.title = meta.title;
  ensureMetaTag('meta[name="description"]', { name: 'description', content: meta.description });
  ensureMetaTag('meta[name="robots"]', { name: 'robots', content: meta.robots || 'index,follow' });
  ensureMetaTag('meta[property="og:title"]', { property: 'og:title', content: meta.title });
  ensureMetaTag('meta[property="og:description"]', { property: 'og:description', content: meta.description });
  ensureMetaTag('meta[property="og:type"]', { property: 'og:type', content: meta.type });
  ensureMetaTag('meta[property="og:url"]', { property: 'og:url', content: meta.url });
  ensureMetaTag('meta[property="og:image"]', {
    property: 'og:image',
    content: getOptimizedImageUrl(meta.image, { width: 1200, height: 630, mode: 'cover', quality: 80 }),
  });
  ensureMetaTag('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  ensureMetaTag('meta[name="twitter:title"]', { name: 'twitter:title', content: meta.title });
  ensureMetaTag('meta[name="twitter:description"]', { name: 'twitter:description', content: meta.description });
  ensureMetaTag('meta[name="twitter:image"]', {
    name: 'twitter:image',
    content: getOptimizedImageUrl(meta.image, { width: 1200, height: 630, mode: 'cover', quality: 80 }),
  });
  ensureLinkTag('link[rel="canonical"]', { rel: 'canonical', href: meta.url });
};
