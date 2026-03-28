import { defineField, defineType } from 'sanity';

export const productType = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  groups: [
    { name: 'basics', title: 'Basics', default: true },
    { name: 'pricing', title: 'Pricing' },
    { name: 'catalog', title: 'Catalog' },
    { name: 'variants', title: 'Variants' },
    { name: 'marketing', title: 'Marketing' },
  ],
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string',
      group: 'basics',
      description: 'Internal storefront ID. Keep this stable once published.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'basics',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'basics',
      description: 'Used in the product URL. Generated from the name by default.',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      group: 'pricing',
      description: 'Base selling price in INR.',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'originalPrice',
      title: 'Original Price',
      type: 'number',
      group: 'pricing',
      description: 'Optional compare-at price. Leave empty if not on sale.',
      validation: (rule) => rule.min(0).custom((value, context) => {
        if (value == null) return true;
        const price = context?.document?.price;
        if (typeof price === 'number' && value < price) {
          return 'Original Price should be greater than or equal to Price.';
        }
        return true;
      }),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      group: 'catalog',
      to: [{ type: 'category' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'collection',
      title: 'Collection',
      type: 'reference',
      group: 'catalog',
      to: [{ type: 'collection' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      group: 'basics',
      description: 'Shown on the product page near the price and CTA.',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'materials',
      title: 'Materials',
      type: 'array',
      group: 'catalog',
      description: 'Examples: Brass, Gold Plated, CZ Stone.',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'sizes',
      title: 'Sizes',
      type: 'array',
      group: 'catalog',
      description: 'Leave one value or leave empty for non-size-select products.',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      group: 'basics',
      description: 'Base gallery used when the product has no variants.',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'variants',
      title: 'Variants',
      type: 'array',
      group: 'variants',
      description: 'Use variants when the same product comes in multiple colors/finishes with separate galleries.',
      of: [
        {
          type: 'object',
          name: 'variant',
          title: 'Variant',
          fields: [
            defineField({
              name: 'id',
              title: 'Variant ID',
              type: 'string',
              description: 'Stable internal ID for this specific color/finish.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'colorName',
              title: 'Color Name',
              type: 'string',
              description: 'Shown beside the swatch on the storefront.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'colorHex',
              title: 'Color Hex',
              type: 'string',
              description: 'Hex code like #1D4ED8 for the color swatch.',
              validation: (rule) => rule.required().regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, {
                name: 'hex color',
                invert: false,
              }),
            }),
            defineField({
              name: 'images',
              title: 'Variant Images',
              type: 'array',
              description: 'These replace the base product gallery when this variant is selected.',
              of: [{ type: 'image', options: { hotspot: true } }],
              validation: (rule) => rule.min(1),
            }),
            defineField({
              name: 'price',
              title: 'Variant Price',
              type: 'number',
              description: 'Optional. Leave empty to use the main product price.',
              validation: (rule) => rule.min(0),
            }),
            defineField({
              name: 'originalPrice',
              title: 'Variant Original Price',
              type: 'number',
              description: 'Optional compare-at price for this variant.',
              validation: (rule) => rule.min(0).custom((value, context) => {
                if (value == null) return true;
                const price = context?.parent?.price;
                if (typeof price === 'number' && value < price) {
                  return 'Variant Original Price should be greater than or equal to Variant Price.';
                }
                return true;
              }),
            }),
            defineField({
              name: 'inStock',
              title: 'Variant In Stock',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'sku',
              title: 'SKU',
              type: 'string',
              description: 'Optional SKU for fulfillment or tracking.',
            }),
          ],
          preview: {
            select: {
              title: 'colorName',
              media: 'images.0',
              price: 'price',
              inStock: 'inStock',
            },
            prepare(selection) {
              const { title, media, price, inStock } = selection;
              return {
                title: title || 'Untitled Variant',
                subtitle: `${typeof price === 'number' ? `INR ${price}` : 'Uses product price'}${inStock === false ? ' • Out of stock' : ''}`,
                media,
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'inStock',
      title: 'In Stock',
      type: 'boolean',
      group: 'catalog',
      initialValue: true,
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured Product',
      type: 'boolean',
      group: 'marketing',
      initialValue: false,
    }),
    defineField({
      name: 'isNew',
      title: 'New Arrival',
      type: 'boolean',
      group: 'marketing',
      initialValue: false,
    }),
    defineField({
      name: 'isSale',
      title: 'On Sale',
      type: 'boolean',
      group: 'marketing',
      initialValue: false,
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      group: 'marketing',
      description: 'Optional storefront rating display from 0 to 5.',
      validation: (rule) => rule.min(0).max(5),
    }),
    defineField({
      name: 'reviewCount',
      title: 'Review Count',
      type: 'number',
      group: 'marketing',
      description: 'Optional storefront review count.',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'marketing',
      description: 'Used by storefront search and discovery.',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'relatedProducts',
      title: 'Related Products',
      type: 'array',
      group: 'marketing',
      description: 'Optional manual picks for the "You Might Also Like" section. Leave empty to use the automatic same-category fallback.',
      of: [
        defineField({
          type: 'reference',
          to: [{ type: 'product' }],
          options: {
            disableNew: true,
          },
        }),
      ],
      validation: (rule) => rule.max(4),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'price',
      media: 'images.0',
      inStock: 'inStock',
      variants: 'variants',
      isFeatured: 'isFeatured',
    },
    prepare(selection) {
      const { title, subtitle, media, inStock, variants, isFeatured } = selection;
      const pieces = [];
      if (typeof subtitle === 'number') pieces.push(`INR ${subtitle}`);
      if (Array.isArray(variants) && variants.length) pieces.push(`${variants.length} variants`);
      if (inStock === false) pieces.push('Out of stock');
      if (isFeatured) pieces.push('Featured');
      return {
        title,
        subtitle: pieces.join(' • '),
        media,
      };
    },
  },
});
