import { defineField, defineType } from 'sanity';

export const categoryType = defineType({
  name: 'category',
  title: 'Category',
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
      description: 'Used in the category URL.',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      group: 'display',
      description: 'Optional emoji or short symbol for storefront badges.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      group: 'display',
      description: 'Recommended for category cards and hero backgrounds.',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'coverImage',
      subtitle: 'slug.current',
    },
    prepare(selection) {
      const { title, media, subtitle } = selection;
      return {
        title,
        subtitle: subtitle ? `/${subtitle}` : '',
        media,
      };
    },
  },
});
