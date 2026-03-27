import { defineField, defineType } from 'sanity';

export const productType = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'originalPrice',
      title: 'Original Price',
      type: 'number',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'collection',
      title: 'Collection',
      type: 'reference',
      to: [{ type: 'collection' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'materials',
      title: 'Materials',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'sizes',
      title: 'Sizes',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (rule) => rule.min(1),
    }),
    defineField({
      name: 'variants',
      title: 'Variants',
      type: 'array',
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
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'colorName',
              title: 'Color Name',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'colorHex',
              title: 'Color Hex',
              type: 'string',
              description: 'Hex code like #1D4ED8 for the color swatch.',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'images',
              title: 'Variant Images',
              type: 'array',
              of: [{ type: 'image', options: { hotspot: true } }],
              validation: (rule) => rule.min(1),
            }),
            defineField({
              name: 'price',
              title: 'Variant Price',
              type: 'number',
              validation: (rule) => rule.min(0),
            }),
            defineField({
              name: 'originalPrice',
              title: 'Variant Original Price',
              type: 'number',
              validation: (rule) => rule.min(0),
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
            }),
          ],
          preview: {
            select: {
              title: 'colorName',
              media: 'images.0',
              price: 'price',
            },
            prepare(selection) {
              const { title, media, price } = selection;
              return {
                title: title || 'Untitled Variant',
                subtitle: typeof price === 'number' ? `INR ${price}` : 'Uses product price',
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
      initialValue: true,
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured Product',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'isNew',
      title: 'New Arrival',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'isSale',
      title: 'On Sale',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (rule) => rule.min(0).max(5),
    }),
    defineField({
      name: 'reviewCount',
      title: 'Review Count',
      type: 'number',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'price',
      media: 'images.0',
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title,
        subtitle: typeof subtitle === 'number' ? `INR ${subtitle}` : '',
        media,
      };
    },
  },
});
