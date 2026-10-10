(function () {
  var MAX_BYTES = 72;
  var encoder = new TextEncoder();

  function byteLength(text) {
    return encoder.encode(text).length;
  }

  function warningFor(input) {
    return document.getElementById(input.id + '-warning');
  }

  function showWarning(input, message) {
    var el = warningFor(input);
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  function hideWarning(input) {
    var el = warningFor(input);
    if (!el) return;
    el.textContent = '';
    el.hidden = true;
  }

  // Value the field would have after inserting `text` over the current selection.
  function valueAfterInsert(input, text) {
    var start = input.selectionStart;
    var end = input.selectionEnd;
    return input.value.slice(0, start) + text + input.value.slice(end);
  }

  function setup(input) {
    var lastValid = input.value;

    input.addEventListener('paste', function (event) {
      var text = event.clipboardData ? event.clipboardData.getData('text') : '';
      if (byteLength(valueAfterInsert(input, text)) > MAX_BYTES) {
        // The pasted text is never truncated: it is rejected as a whole.
        event.preventDefault();
        showWarning(input, 'Pasted password is too long. Type a shorter password.');
      } else {
        hideWarning(input);
      }
    });

    input.addEventListener('beforeinput', function (event) {
      if (event.inputType === 'insertFromPaste') return;
      if (event.data === null || event.data === undefined) return;
      if (byteLength(valueAfterInsert(input, event.data)) > MAX_BYTES) {
        event.preventDefault();
        showWarning(input, 'Maximum password length reached.');
      }
    });

    // Fallback for input methods that bypass beforeinput (for example IME composition).
    input.addEventListener('input', function () {
      if (byteLength(input.value) > MAX_BYTES) {
        input.value = lastValid;
        showWarning(input, 'Maximum password length reached.');
      } else {
        lastValid = input.value;
        if (byteLength(input.value) < MAX_BYTES) hideWarning(input);
      }
    });
  }

  document.querySelectorAll('input[data-password-limit]').forEach(setup);
})();
