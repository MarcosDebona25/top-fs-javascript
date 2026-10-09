'use strict';

// Largest quantity a single receipt or dispatch may move.
const MAX_MOVEMENT_QUANTITY = 10000;

// Largest stock a part may hold. It also caps the counted quantity of an
// adjustment, which is an absolute stock figure.
const MAX_STOCK = 1000000;

module.exports = { MAX_MOVEMENT_QUANTITY, MAX_STOCK };
