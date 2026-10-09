// Toasts: auto-dismiss after a timeout (paused while hovered/focused) and
// closable with the X button. Without JS they stay visible, still readable.
(function () {
  var DURATION = { success: 5000, error: 8000 };

  function dismiss(toast) {
    if (toast.dataset.closing) return;
    toast.dataset.closing = '1';
    toast.classList.add('toast-out');
    setTimeout(function () { toast.remove(); }, 250);
  }

  document.querySelectorAll('.toast').forEach(function (toast) {
    var ms = DURATION[toast.dataset.kind] || DURATION.success;
    var bar = toast.querySelector('.toast-bar');
    var timer = null;
    var remaining = ms;
    var startedAt = 0;

    function start() {
      startedAt = Date.now();
      if (bar) {
        bar.style.transition = 'transform ' + remaining + 'ms linear';
        bar.style.transform = 'scaleX(0)';
      }
      timer = setTimeout(function () { dismiss(toast); }, remaining);
    }

    function pause() {
      if (timer === null) return;
      clearTimeout(timer);
      timer = null;
      remaining -= Date.now() - startedAt;
      if (bar) {
        var current = getComputedStyle(bar).transform;
        bar.style.transition = 'none';
        bar.style.transform = current;
      }
    }

    toast.querySelector('.toast-close').addEventListener('click', function () {
      pause();
      dismiss(toast);
    });
    toast.addEventListener('mouseenter', pause);
    toast.addEventListener('focusin', pause);
    toast.addEventListener('mouseleave', start);
    toast.addEventListener('focusout', start);

    // Let the bar paint at full width before it starts shrinking.
    requestAnimationFrame(function () { requestAnimationFrame(start); });
  });
})();
