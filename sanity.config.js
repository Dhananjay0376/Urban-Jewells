import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { schemaTypes } from './schemas/index.js';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.VITE_SANITY_DATASET || 'production';

if (!projectId) {
  throw new Error('Missing SANITY_STUDIO_PROJECT_ID or VITE_SANITY_PROJECT_ID in .env');
}

export default defineConfig({
  name: 'default',
  title: 'Urban Jewells CMS',
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
