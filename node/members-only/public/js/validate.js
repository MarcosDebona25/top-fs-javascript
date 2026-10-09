'use strict';

// Real-time inline validation. UX only: the server re-validates everything
// with the same rules (shared/rules.js, loaded as window.Rules).
(function () {
  if (!window.Rules) return;
  const R = window.Rules;

  const RULES = {
    firstName: (v) => R.validateFirstName(v),
    lastName: (v) => R.validateLastName(v),
    email: (v) => R.validateEmail(v),
    password: (v) => R.validatePassword(v),
    confirmPassword: (v, form) => R.validateConfirm(form.elements.password.value, v),
    passcode: (v) => R.validatePasscode(v),
    title: (v) => R.validateTitle(v),
    text: (v) => R.validateText(v),
  };

  const form = document.querySelector('form[data-validate]');
  if (!form) return;

  const submit = form.querySelector('[data-submit]');
  const touched = new Set();
  // Async email availability: null = unknown / not checked yet.
  let emailTaken = null;
  let emailTimer = null;
  let emailSeq = 0;

  function fields() {
    return Array.from(form.querySelectorAll('[data-rule]'));
  }

  function errorFor(input) {
    const rule = RULES[input.dataset.rule];
    const msg = rule ? rule(input.value, form) : null;
    if (!msg && input.dataset.rule === 'email' && emailTaken === true) {
      return 'That email is already registered.';
    }
    return msg;
  }

  function show(input, msg) {
    const out = form.querySelector('[data-error-for="' + input.dataset.rule + '"]');
    if (out) out.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function updateChecklist() {
    const pw = form.elements.password;
    const list = form.querySelector('#password-checklist');
    if (!pw || !list) return;
    R.PASSWORD_REQUIREMENTS.forEach((req) => {
      const li = list.querySelector('[data-req="' + req.id + '"]');
      if (!li) return;
      const ok = req.test(pw.value);
      li.classList.toggle('ok', ok);
      li.classList.toggle('bad', !ok && touched.has('password'));
      li.textContent = (ok ? '✓ ' : '✗ ') + req.label;
    });
  }

  function updateCounters() {
    form.querySelectorAll('[data-counter-for]').forEach((el) => {
      const input = form.elements[el.dataset.counterFor];
      if (!input) return;
      const max = Number(el.dataset.max);
      const len = input.value.length;
      el.textContent = len + ' / ' + max;
      el.classList.toggle('over', len > max);
    });
  }

  function updateSubmit() {
    if (!submit) return;
    const invalid = fields().some((f) => errorFor(f));
    submit.disabled = invalid;
  }

  function refresh(input) {
    if (touched.has(input.dataset.rule)) show(input, errorFor(input));
    updateChecklist();
    updateCounters();
    updateSubmit();
  }

  function checkEmail(input) {
    emailTaken = null;
    clearTimeout(emailTimer);
    if (R.validateEmail(input.value)) return;
    const seq = ++emailSeq;
    emailTimer = setTimeout(async () => {
      try {
        const res = await fetch('/api/email-available?email=' + encodeURIComponent(input.value.trim()));
        const data = await res.json();
        if (seq !== emailSeq) return; // stale response
        emailTaken = data.valid && !data.available;
        refresh(input);
      } catch (e) {
        emailTaken = null; // network error: server still validates
      }
    }, 300);
  }

  fields().forEach((input) => {
    input.addEventListener('input', () => {
      touched.add(input.dataset.rule);
      if (input.dataset.rule === 'email') checkEmail(input);
      if (input.dataset.rule === 'password' && form.elements.confirmPassword) {
        // Keep the match indicator in sync when the first password changes.
        if (form.elements.confirmPassword.value) touched.add('confirmPassword');
        refresh(form.elements.confirmPassword);
      }
      refresh(input);
    });
    input.addEventListener('blur', () => {
      touched.add(input.dataset.rule);
      refresh(input);
    });
  });

  form.addEventListener('submit', (event) => {
    let firstBad = null;
    fields().forEach((f) => {
      touched.add(f.dataset.rule);
      const msg = errorFor(f);
      show(f, msg);
      if (msg && !firstBad) firstBad = f;
    });
    if (firstBad) {
      event.preventDefault();
      firstBad.focus();
    }
  });

  // Initial state: server-rendered errors stay; submit starts disabled if invalid.
  updateChecklist();
  updateCounters();
  updateSubmit();
})();
