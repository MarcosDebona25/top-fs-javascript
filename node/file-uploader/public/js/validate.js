(function () {
  var encoder = new TextEncoder();

  function errorElement(input) {
    return document.getElementById(input.id + '-error');
  }

  function showError(input, message) {
    var el = errorElement(input);
    input.setAttribute('aria-invalid', 'true');
    if (el) {
      el.textContent = message;
      el.hidden = false;
    }
  }

  function clearError(input) {
    var el = errorElement(input);
    input.removeAttribute('aria-invalid');
    if (el) {
      el.textContent = '';
      el.hidden = true;
    }
  }

  function chars(text) {
    return Array.from(text).length;
  }

  // Returns an error message, or '' when the field is valid.
  function check(input) {
    var isPassword = input.type === 'password';
    var isFile = input.type === 'file';

    if (isFile) {
      var file = input.files && input.files[0];
      if (!file) return input.required ? 'Select a file to upload.' : '';
      var allowed = (input.dataset.allowedExt || '').split(',').filter(Boolean);
      var dot = file.name.lastIndexOf('.');
      var ext = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : '';
      if (allowed.length && allowed.indexOf(ext) === -1) {
        return 'This file type is not allowed. Allowed types: ' + allowed.join(', ').toUpperCase() + '.';
      }
      var maxSize = Number(input.dataset.maxSize);
      if (maxSize && file.size > maxSize) return 'File is too large (max 10 MB). Select a smaller file.';
      return '';
    }

    var value = isPassword ? input.value : input.value.trim();

    if (input.required && value === '') {
      return isPassword ? 'Password is required.' : 'This field is required.';
    }
    if (value === '') return '';

    if (input.type === 'email' && input.validity.typeMismatch) return 'Enter a valid email address.';

    var min = Number(input.getAttribute('minlength'));
    if (min && chars(value) < min) return 'Must be at least ' + min + ' characters.';

    var max = Number(input.getAttribute('maxlength'));
    if (max && !isPassword && chars(value) > max) return 'Must be ' + max + ' characters or fewer.';

    if (input.dataset.maxBytes && encoder.encode(value).length > Number(input.dataset.maxBytes)) {
      return 'Password is too long. Use a shorter password.';
    }

    var pattern = input.getAttribute('pattern');
    if (pattern) {
      var testValue = input.dataset.lowercase ? value.toLowerCase() : value;
      if (!new RegExp('^(?:' + pattern + ')$').test(testValue)) {
        return input.dataset.patternMessage || 'Invalid format.';
      }
    }

    if (input.dataset.noSlashes && /[\/\\]/.test(value)) return "Can't contain / or \\.";

    if (input.dataset.noExtension && /\.(?=[a-z0-9]{1,5}$)[a-z0-9]*[a-z][a-z0-9]*$/i.test(value)) {
      return "File extension can't be changed.";
    }

    if (input.dataset.match) {
      var other = document.getElementById(input.dataset.match);
      if (other && other.value !== input.value) return "Passwords don't match.";
    }

    return '';
  }

  function setup(form) {
    form.setAttribute('novalidate', '');
    var controls = Array.prototype.filter.call(form.elements, function (el) {
      return el.tagName === 'INPUT' && el.type !== 'hidden' && el.type !== 'submit';
    });

    form.addEventListener('submit', function (event) {
      var firstInvalid = null;
      controls.forEach(function (input) {
        var message = check(input);
        if (message) {
          showError(input, message);
          if (!firstInvalid) firstInvalid = input;
        } else {
          clearError(input);
        }
      });
      if (firstInvalid) {
        event.preventDefault();
        firstInvalid.focus();
      }
    });

    controls.forEach(function (input) {
      var eventName = input.type === 'file' ? 'change' : 'input';
      input.addEventListener(eventName, function () {
        if (input.getAttribute('aria-invalid') === 'true') {
          var message = check(input);
          if (message) showError(input, message);
          else clearError(input);
        }
      });
    });
  }

  document.querySelectorAll('form[data-validate]').forEach(setup);
})();
