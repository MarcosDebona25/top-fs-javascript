'use strict';

const categoryDb = require('../db/categories');

async function showHome(req, res, next) {
  try {
    const categories = await categoryDb.listCategoriesWithCounts();
    res.render('home', { categories });
  } catch (err) {
    next(err);
  }
}

module.exports = { showHome };
