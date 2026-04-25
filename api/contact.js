const {submitContact} = require('../server/contactService');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({message: 'Method not allowed.'});
    return;
  }

  const body =
    req.body && typeof req.body === 'object'
      ? req.body
      : JSON.parse(req.body || '{}');

  const result = await submitContact(body);
  res.status(result.status).json(result.body);
};
