/* Utility / helper functions used across the app */
(function (global) {
  'use strict';

  function formatSalary(amount) {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatSalaryRange(salary) {
    if (salary.min === 0 && salary.max === 0) return 'Salary not disclosed';
    return formatSalary(salary.min) + ' – ' + formatSalary(salary.max);
  }

  function timeAgo(dateString) {
    var date = new Date(dateString);
    var now = new Date();
    var diffMs = now.getTime() - date.getTime();
    var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return diffDays + ' days ago';
    if (diffDays < 30) {
      var weeks = Math.floor(diffDays / 7);
      return weeks + ' week' + (weeks > 1 ? 's' : '') + ' ago';
    }
    var months = Math.floor(diffDays / 30);
    return months + ' month' + (months > 1 ? 's' : '') + ' ago';
  }

  function truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  }

  function titleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
    });
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPassword(password) {
    return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  }

  function getStatusColor(status) {
    var colors = {
      pending: '#f59e0b',
      reviewed: '#3b82f6',
      accepted: '#10b981',
      rejected: '#ef4444',
    };
    return colors[status] || '#6b7280';
  }

  function generateId() {
    return Math.random().toString(36).slice(2, 11);
  }

  function debounce(fn, delay) {
    var timer;
    return function () {
      var args = arguments;
      var context = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  function stripMarkdown(text) {
    return text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/- /g, '')
      .replace(/\n+/g, ' ')
      .trim();
  }

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getQueryParams() {
    var params = {};
    var search = window.location.search.substring(1);
    if (!search) return params;
    search.split('&').forEach(function (pair) {
      var parts = pair.split('=');
      params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
    });
    return params;
  }

  function renderDescriptionHtml(text) {
    var lines = text.split('\n');
    var html = '';
    lines.forEach(function (line) {
      if (line.startsWith('## ')) {
        html += '<h2>' + escapeHtml(line.slice(3)) + '</h2>';
      } else if (line.startsWith('- ')) {
        var content = line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html += '<ul><li>' + content + '</li></ul>';
      } else if (line.trim() !== '') {
        var para = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html += '<p>' + para + '</p>';
      }
    });
    return html;
  }

  global.IndeedHelpers = {
    formatSalary: formatSalary,
    formatSalaryRange: formatSalaryRange,
    timeAgo: timeAgo,
    truncate: truncate,
    titleCase: titleCase,
    isValidEmail: isValidEmail,
    isValidPassword: isValidPassword,
    getStatusColor: getStatusColor,
    generateId: generateId,
    debounce: debounce,
    stripMarkdown: stripMarkdown,
    formatNumber: formatNumber,
    escapeHtml: escapeHtml,
    getQueryParams: getQueryParams,
    renderDescriptionHtml: renderDescriptionHtml,
  };
})(window);
