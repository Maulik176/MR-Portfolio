const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const {submitContact} = require('./contactService');

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 8787;

app.use(express.json({limit: '32kb'}));

app.post('/api/contact', async (req, res) => {
  const result = await submitContact(req.body);
  res.status(result.status).json(result.body);
});

if (process.env.NODE_ENV === 'production') {
  const buildDir = path.join(__dirname, '..', 'build');
  app.use(express.static(buildDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildDir, 'index.html'));
  });
}

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on ${port}`);
});
