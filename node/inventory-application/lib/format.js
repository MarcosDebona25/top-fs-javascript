'use strict';

function formatPrice(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return '0.00';
  return number.toFixed(2);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

module.exports = { formatPrice, formatDateTime };
