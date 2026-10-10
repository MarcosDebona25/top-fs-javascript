(function () {
  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (error) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  function flash(button, label) {
    var original = button.dataset.label || button.textContent;
    button.dataset.label = original;
    button.textContent = label;
    setTimeout(function () {
      button.textContent = original;
    }, 2000);
  }

  document.querySelectorAll('[data-copy]').forEach(function (button) {
    button.addEventListener('click', function () {
      var text = button.dataset.copy;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { flash(button, 'Copied'); },
          function () { flash(button, fallbackCopy(text) ? 'Copied' : 'Copy failed'); }
        );
      } else {
        flash(button, fallbackCopy(text) ? 'Copied' : 'Copy failed');
      }
    });
  });
})();
