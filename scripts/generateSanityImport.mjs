import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const rootDir = path.resolve(process.cwd());
const sourcePath = path.join(rootDir, 'UrbanJewells.jsx');
const outputDir = path.join(rootDir, 'sanity-import');
const outputPath = path.join(outputDir, 'catalog.ndjson');

function pickArrayBlock(source, constantName) {
  const marker = `const ${constantName} = [`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Could not find ${constantName} in UrbanJewells.jsx`);
  }

  let index = start + marker.length - 1;
  let depth = 0;

  while (index < source.length) {
    const char = source[index];
    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        const semicolonIndex = source.indexOf(';', index);
        return source.slice(start, semicolonIndex + 1);
      }
    }
    index += 1;
  }

  throw new Error(`Could not parse ${constantName} array block`);
}

function evaluateCatalog(source) {
  const blocks = ['PRODUCTS', 'COLLECTIONS', 'CATEGORIES']
    .map((name) => pickArrayBlock(source, name))
    .join('\n');

  const script = `
    ${blocks}
    ({ PRODUCTS, COLLECTIONS, CATEGORIES });
  `;

  return vm.runInNewContext(script, {});
}

function clean(value) {
  if (Array.isArray(value)) {
    const items = value.map(clean).filter((item) => item !== undefined);
    return items;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, clean(item)])
      .filter(([, item]) => item !== undefined);
    return Object.fromEntries(entries);
  }

  if (value === undefined) return undefined;
  return value;
}

function imageField(url, key) {
  if (!url) return undefined;
  return {
    _type: 'image',
    ...(key ? { _key: key } : {}),
    _sanityAsset: `image@${url}`,
  };
}

function categoryDoc(category) {
  return clean({
    _id: `category-${category.slug}`,
    _type: 'category',
    id: category.id,
    name: category.name,
    slug: { _type: 'slug', current: category.slug },
    icon: category.icon || undefined,
    coverImage: imageField(category.coverImage),
  });
}

function collectionDoc(collection, products) {
  const derivedProductCount = products.filter((product) => product.collection === collection.slug).length;

  return clean({
    _id: `collection-${collection.slug}`,
    _type: 'collection',
    id: collection.id,
    name: collection.name,
    slug: { _type: 'slug', current: collection.slug },
    tagline: collection.tagline,
    coverImage: imageField(collection.coverImage),
    productCount: collection.productCount || derivedProductCount,
    mood: collection.mood,
  });
}

function productDoc(product) {
  return clean({
    _id: `product-${product.slug}`,
    _type: 'product',
    id: String(product.id),
    name: product.name,
    slug: { _type: 'slug', current: product.slug },
    price: product.price,
    originalPrice: product.originalPrice,
    category: {
      _type: 'reference',
      _ref: `category-${product.category}`,
    },
    collection: {
      _type: 'reference',
      _ref: `collection-${product.collection}`,
    },
    shortDescription: product.shortDescription,
    materials: product.materials,
    sizes: product.sizes,
    images: (product.images || []).map((url, index) => imageField(url, `${product.slug}-${index}`)),
    inStock: product.inStock !== false,
    isFeatured: Boolean(product.isFeatured),
    isNew: Boolean(product.isNew),
    isSale: Boolean(product.isSale),
    rating: product.rating,
    reviewCount: product.reviewCount,
    tags: product.tags,
  });
}

async function main() {
  const source = await fs.readFile(sourcePath, 'utf8');
  const { PRODUCTS, COLLECTIONS, CATEGORIES } = evaluateCatalog(source);

  const docs = [
    ...CATEGORIES.map(categoryDoc),
    ...COLLECTIONS.map((collection) => collectionDoc(collection, PRODUCTS)),
    ...PRODUCTS.map(productDoc),
  ];

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, docs.map((doc) => JSON.stringify(doc)).join('\n') + '\n', 'utf8');

  console.log(`Generated ${docs.length} Sanity documents at ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
