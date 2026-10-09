'use strict';

require('dotenv').config();

const createApp = require('./app');

const port = process.env.PORT || 3000;
createApp().listen(port, () => console.log(`Members Only listening on port ${port}`));
