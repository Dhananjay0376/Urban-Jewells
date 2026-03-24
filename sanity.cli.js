const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

if (!projectId) {
  throw new Error('Missing SANITY_STUDIO_PROJECT_ID in .env');
}

export default {
  api: {
    projectId,
    dataset,
  },
};
