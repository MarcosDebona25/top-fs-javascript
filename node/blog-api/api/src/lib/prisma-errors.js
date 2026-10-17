// Prisma 7 with a driver adapter does not always populate meta.target for P2002,
// so the violated constraint is also read from the adapter error.
function uniqueConstraintNames(error) {
  const names = [];
  const { target, driverAdapterError } = error.meta || {};
  if (Array.isArray(target)) names.push(...target);
  else if (typeof target === 'string') names.push(target);

  const constraint = driverAdapterError && driverAdapterError.cause && driverAdapterError.cause.constraint;
  if (constraint) {
    if (typeof constraint.index === 'string') names.push(constraint.index);
    if (Array.isArray(constraint.fields)) names.push(...constraint.fields);
  }
  return names.map((name) => String(name).toLowerCase());
}

// Returns 'email', 'username', 'name' or null for a P2002 error.
function uniqueViolationField(error) {
  if (!error || error.code !== 'P2002') return null;
  const names = uniqueConstraintNames(error);
  const has = (word) => names.some((name) => name.includes(word));
  if (has('email')) return 'email';
  if (has('username')) return 'username';
  if (has('name') || has('parentid')) return 'name';
  return null;
}

module.exports = { uniqueViolationField };
