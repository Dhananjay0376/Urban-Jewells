import { defineField, defineType } from 'sanity';

export const collectionType = defineType({
  name: 'collection',
  title: 'Collection',
  type: 'document',
  groups: [
    { name: 'basics', title: 'Basics', default: true },
    { name: 'display', title: 'Display' },
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
      description: 'Used in the collection URL.',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'display',
      description: 'Short supporting copy shown on collection cards/pages.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      group: 'display',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'productCount',
      title: 'Product Count',
      type: 'number',
      group: 'display',
      description: 'Optional. Leave empty to let the storefront derive the count from products.',
    }),
    defineField({
      name: 'mood',
      title: 'Mood',
      type: 'string',
      group: 'display',
      description: 'Small editorial label shown on collection cards.',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'tagline',
      media: 'coverImage',
      mood: 'mood',
    },
    prepare(selection) {
      const { title, subtitle, media, mood } = selection;
      return {
        title,
        subtitle: [mood, subtitle].filter(Boolean).join(' • '),
        media,
      };
    },
  },
});
