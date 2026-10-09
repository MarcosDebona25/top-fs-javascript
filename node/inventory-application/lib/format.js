'use strict';

function formatPrice(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return '0.00';
  return number.toFixed(2);
}

// Display-only amount with thousands separators (not for form values).
function formatMoney(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return '0.00';
  return number.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

module.exports = { formatPrice, formatMoney, formatDateTime };
