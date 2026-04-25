import sanityClient from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const projectId = process.env.REACT_APP_SANITY_PROJECT_ID;

const missingProjectIdMessage =
  'Missing REACT_APP_SANITY_PROJECT_ID. Create .env with REACT_APP_SANITY_PROJECT_ID=<your_sanity_project_id> and restart the dev server.';

const disabledClient = {
  fetch: async () => [],
};

if (!projectId) {
  // Keep app running without Sanity data and show a clear setup instruction.
  // eslint-disable-next-line no-console
  console.error(missingProjectIdMessage);
}

export const client = projectId
  ? sanityClient({
      projectId,
      dataset: 'production',
      apiVersion: '2022-02-01',
      useCdn: true,
    })
  : disabledClient;

const builder = projectId ? imageUrlBuilder(client) : null;

export const urlFor = (source) => (builder ? builder.image(source) : '');
