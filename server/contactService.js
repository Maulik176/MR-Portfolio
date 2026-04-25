const defaultDataset = 'production';
const defaultApiVersion = '2022-02-01';

function getConfig() {
  return {
    projectId:
      process.env.SANITY_PROJECT_ID || process.env.REACT_APP_SANITY_PROJECT_ID,
    token: process.env.SANITY_TOKEN || process.env.REACT_APP_SANITY_TOKEN,
    dataset: process.env.SANITY_DATASET || defaultDataset,
    apiVersion: process.env.SANITY_API_VERSION || defaultApiVersion,
  };
}

async function submitContact(body, fetchImpl = fetch) {
  const {projectId, token, dataset, apiVersion} = getConfig();

  if (!projectId || !token) {
    return {
      status: 500,
      body: {message: 'Contact service is not configured.'},
    };
  }

  const safeBody = body && typeof body === 'object' ? body : {};
  const payload = {
    mutations: [
      {
        create: {
          _type: 'contact',
          name: typeof safeBody.name === 'string' ? safeBody.name : '',
          email: typeof safeBody.email === 'string' ? safeBody.email : '',
          message: typeof safeBody.message === 'string' ? safeBody.message : '',
        },
      },
    ],
  };

  try {
    const response = await fetchImpl(
      `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        status: response.status,
        body: {
          message:
            (data && data.message) ||
            'Message could not be sent right now. Please try again.',
        },
      };
    }

    return {
      status: 201,
      body: {ok: true},
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return {
      status: 500,
      body: {
        message: 'Message could not be sent right now. Please try again.',
      },
    };
  }
}

module.exports = {
  submitContact,
};
