/* Toast notification system */
(function (global) {
  'use strict';

  var TOAST_ICONS = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  var toasts = [];

  function getContainer() {
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('role', 'alert');
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  function renderToasts() {
    var container = getContainer();
    if (toasts.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }
    container.style.display = 'flex';
    container.innerHTML = toasts
      .map(function (toast) {
        return (
          '<div class="toast toast-' +
          toast.type +
          '" data-toast-id="' +
          toast.id +
          '" title="Click to dismiss">' +
          '<span class="toast-icon">' +
          TOAST_ICONS[toast.type] +
          '</span>' +
          '<span class="toast-message">' +
          IndeedHelpers.escapeHtml(toast.message) +
          '</span>' +
          '<button class="toast-close" aria-label="Dismiss notification">✕</button>' +
          '</div>'
        );
      })
      .join('');

    container.querySelectorAll('.toast').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.classList.contains('toast-close')) {
          e.stopPropagation();
        }
        removeToast(el.getAttribute('data-toast-id'));
      });
    });
  }

  function showToast(message, type) {
    type = type || 'info';
    var id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    toasts.push({ id: id, message: message, type: type });
    renderToasts();
    setTimeout(function () {
      removeToast(id);
    }, 4000);
  }

  function removeToast(id) {
    toasts = toasts.filter(function (t) {
      return t.id !== id;
    });
    renderToasts();
  }

  global.IndeedToast = {
    showToast: showToast,
    removeToast: removeToast,
  };
})(window);
