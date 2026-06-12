/* Home page interactivity */
(function (global) {
  'use strict';

  function initHomePage() {
    var whatInput = document.getElementById('hero-what');
    var whereInput = document.getElementById('hero-where');
    var searchForm = document.getElementById('hero-search-form');

    if (searchForm) {
      searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var search = whatInput ? whatInput.value : '';
        var location = whereInput ? whereInput.value : '';
        var url = 'jobs.html?search=' + encodeURIComponent(search) + '&location=' + encodeURIComponent(location);
        window.location.href = url;
      });
    }

    document.querySelectorAll('.trending-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        window.location.href = 'jobs.html?search=' + encodeURIComponent(chip.getAttribute('data-chip'));
      });
    });

    document.querySelectorAll('.company-card').forEach(function (card) {
      card.addEventListener('click', function () {
        window.location.href = 'jobs.html?search=' + encodeURIComponent(card.getAttribute('data-company'));
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') card.click();
      });
    });

    document.querySelectorAll('.city-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.location.href = 'jobs.html?location=' + encodeURIComponent(btn.getAttribute('data-city'));
      });
      btn.addEventListener('mouseenter', function () {
        btn.style.borderColor = '#2557a7';
        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.borderColor = '#d4d2d0';
        btn.style.boxShadow = 'none';
      });
    });

    if (global.IndeedJobs && global.IndeedJobs.initHomeJobCards) {
      global.IndeedJobs.initHomeJobCards();
    }
  }

  global.IndeedHome = { initHomePage: initHomePage };
})(window);
