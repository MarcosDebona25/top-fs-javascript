(function () {
  // Without this script the trigger stays a plain link to the confirmation page.
  document.querySelectorAll('[data-dialog-open]').forEach(function (trigger) {
    var dialog = document.getElementById(trigger.dataset.dialogOpen);
    if (!dialog || typeof dialog.showModal !== 'function') return;

    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      dialog.showModal();
    });

    dialog.querySelectorAll('[data-dialog-close]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        dialog.close();
      });
    });

    // The dialog element itself is only the click target on the backdrop.
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
  });
})();
