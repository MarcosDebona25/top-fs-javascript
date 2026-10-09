'use strict';

require('dotenv').config();

const app = require('./app');

const port = Number(process.env.PORT) || 3000;
// Local-only by default. Set HOST=0.0.0.0 to accept connections from other machines.
const host = process.env.HOST || '127.0.0.1';

const server = app.listen(port, host);

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(
      `Port ${port} is already in use. Pick another one and retry, e.g.:\n` +
        `  PORT=${port + 100} npm start`
    );
    process.exit(1);
  }
  throw err;
});

server.on('listening', () => {
  console.log(`Axle Supply listening on http://${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
