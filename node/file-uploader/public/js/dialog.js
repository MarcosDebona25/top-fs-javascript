(function () {
  // Without this script each trigger stays a plain link to its fallback page.
  document.querySelectorAll('dialog.modal').forEach(function (dialog) {
    if (typeof dialog.showModal !== 'function') return;

    dialog.querySelectorAll('[data-dialog-close]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        dialog.close();
      });
    });

    // The dialog element itself is only the target on the backdrop. Checking where the
    // press started keeps a text selection dragged out of a field from closing it.
    var pressedBackdrop = false;
    dialog.addEventListener('mousedown', function (event) {
      pressedBackdrop = event.target === dialog;
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog && pressedBackdrop) dialog.close();
    });

    // The server renders it open after a failed submit: promote it to a modal.
    if (dialog.open) {
      dialog.close();
      dialog.showModal();
    }
  });

  document.querySelectorAll('[data-dialog-open]').forEach(function (trigger) {
    var dialog = document.getElementById(trigger.dataset.dialogOpen);
    if (!dialog || typeof dialog.showModal !== 'function') return;

    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      dialog.showModal();
    });
  });
})();
