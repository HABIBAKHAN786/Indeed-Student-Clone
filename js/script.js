/* Shared layout, navigation, and app bootstrap */
(function (global) {
  'use strict';

  var AUTH_PAGES = ['login', 'signup'];
  var FULLSCREEN_PAGES = ['backend-code'];

  function getCurrentPage() {
    var page = document.body.getAttribute('data-page') || 'home';
    var params = IndeedHelpers.getQueryParams();
    if (page === 'employer-dashboard' && params.section === 'post-job') {
      return 'post-job';
    }
    return page;
  }

  function isAuthPage() {
    return AUTH_PAGES.indexOf(getCurrentPage()) !== -1;
  }

  function isFullScreenPage() {
    return FULLSCREEN_PAGES.indexOf(getCurrentPage()) !== -1;
  }

  function renderLearningBanner() {
    if (isFullScreenPage() || sessionStorage.getItem('banner_dismissed')) return '';
    return (
      '<div id="learning-banner" style="background:linear-gradient(135deg,#1e3a5f,#2557a7);color:white;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px;flex-wrap:wrap;">' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
      '<span style="font-size:16px;">📚</span><strong>LEARNING PROJECT</strong>' +
      '<span style="opacity:0.9;">This is an educational clone of Indeed Pakistan. NOT affiliated with Indeed Inc. Use demo accounts: ' +
      '<code style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;">demo.seeker@example.com</code> or ' +
      '<code style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;">demo.employer@example.com</code> with password ' +
      '<code style="background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:3px;">Demo1234</code></span></div>' +
      '<button id="dismiss-banner" style="background:rgba(255,255,255,0.2);border:none;color:white;border-radius:4px;padding:4px 10px;cursor:pointer;font-family:inherit;font-size:12px;flex-shrink:0;">Got it ✓</button>' +
      '</div>'
    );
  }

  function renderNavbar(currentPage, user) {
    var seekerLinks = '';
    var employerLinks = '';
    var guestLink = '';
    var authSection = '';

    if (user && user.role === 'seeker') {
      seekerLinks =
        '<a class="navbar-link' + (currentPage === 'dashboard' ? ' active' : '') + '" href="dashboard.html">My Dashboard</a>' +
        '<a class="navbar-link" href="dashboard.html">Post Your CV</a>';
    }

    if (user && user.role === 'employer') {
      employerLinks =
        '<a class="navbar-link' + (currentPage === 'employer-dashboard' ? ' active' : '') + '" href="employer-dashboard.html">My Dashboard</a>' +
        '<a class="navbar-link' + (currentPage === 'post-job' ? ' active' : '') + '" href="employer-dashboard.html?section=post-job" style="background:#2557a7;color:white;padding:8px 16px;border-radius:6px;">Post a Job</a>';
    }

    if (!user) {
      guestLink = '<a class="navbar-link" href="login.html">Employers / Post Job</a>';
    }

    if (user) {
      var dashHref = user.role === 'employer' ? 'employer-dashboard.html' : 'dashboard.html';
      authSection =
        '<div style="display:flex;align-items:center;gap:12px;">' +
        '<div class="avatar" style="width:36px;height:36px;font-size:14px;cursor:pointer;" data-href="' + dashHref + '" title="Logged in as ' + IndeedHelpers.escapeHtml(user.name) + '">' +
        user.name.charAt(0).toUpperCase() +
        '</div>' +
        '<button class="btn btn-ghost btn-sm" id="navbar-logout">Sign out</button></div>';
    } else {
      authSection = '<button class="btn btn-outline btn-sm" data-href="login.html">Sign in</button>';
    }

    return (
      '<nav class="navbar"><div class="navbar-inner">' +
      '<a class="navbar-logo" href="index.html" aria-label="Indeed Pakistan - Home">' +
      '<span>in</span>deed<small style="font-size:14px;font-weight:400;color:#767676;">&nbsp;Pakistan</small></a>' +
      '<div class="navbar-links" id="navbar-links">' +
      '<a class="navbar-link' + (currentPage === 'jobs' ? ' active' : '') + '" href="jobs.html">Find Jobs</a>' +
      '<a class="navbar-link" href="index.html">Company Reviews</a>' +
      seekerLinks + employerLinks + guestLink + authSection +
      '</div>' +
      '<button class="navbar-toggle" id="navbar-toggle" aria-label="Toggle navigation menu" aria-expanded="false">' +
      '<span id="bar1"></span><span id="bar2"></span><span id="bar3"></span></button>' +
      '</div></nav>'
    );
  }

  function renderFooter() {
    var year = new Date().getFullYear();
    return (
      '<footer class="footer"><div class="footer-grid">' +
      '<div><div style="font-size:20px;font-weight:900;color:white;margin-bottom:12px;letter-spacing:-0.5px;">' +
      '<span style="background:white;color:#2557a7;padding:1px 6px;border-radius:3px;margin-right:1px;">in</span>deed</div>' +
      '<p style="font-size:13px;line-height:1.6;margin-bottom:12px;">Pakistan\'s #1 job search platform connecting millions of job seekers with the best employers nationwide.</p>' +
      '<div style="display:flex;gap:12px;margin-top:12px;"><span style="font-size:20px;cursor:pointer;opacity:0.7;">𝕏</span>' +
      '<span style="font-size:20px;cursor:pointer;opacity:0.7;">📘</span><span style="font-size:20px;cursor:pointer;opacity:0.7;">💼</span>' +
      '<span style="font-size:20px;cursor:pointer;opacity:0.7;">📷</span></div></div>' +
      '<div><div class="footer-col-title">For Job Seekers</div>' +
      '<a class="footer-link" href="jobs.html">Browse Jobs</a><a class="footer-link" href="login.html">Post Your CV</a>' +
      '<a class="footer-link" href="jobs.html">Remote Jobs</a><a class="footer-link" href="jobs.html">Part-time Jobs</a>' +
      '<a class="footer-link" href="jobs.html">Internships</a><a class="footer-link" href="dashboard.html">Job Alerts</a>' +
      '<a class="footer-link" href="dashboard.html">My Applications</a></div>' +
      '<div><div class="footer-col-title">For Employers</div>' +
      '<a class="footer-link" href="employer-dashboard.html?section=post-job">Post a Job</a>' +
      '<a class="footer-link" href="employer-dashboard.html">Employer Dashboard</a>' +
      '<a class="footer-link">Talent Search</a><a class="footer-link">Resume Database</a>' +
      '<a class="footer-link">Pricing Plans</a><a class="footer-link">Sponsored Jobs</a></div>' +
      '<div><div class="footer-col-title">Popular Searches</div>' +
      '<a class="footer-link" href="jobs.html?location=Karachi">Jobs in Karachi</a>' +
      '<a class="footer-link" href="jobs.html?location=Lahore">Jobs in Lahore</a>' +
      '<a class="footer-link" href="jobs.html?location=Islamabad">Jobs in Islamabad</a>' +
      '<a class="footer-link" href="jobs.html?search=IT">IT Jobs Pakistan</a>' +
      '<a class="footer-link" href="jobs.html?search=Software Engineer">Software Engineer Jobs</a>' +
      '<a class="footer-link" href="jobs.html?search=Marketing">Marketing Jobs</a>' +
      '<a class="footer-link" href="jobs.html?search=Finance">Finance Jobs</a></div>' +
      '<div><div class="footer-col-title">Company</div>' +
      '<a class="footer-link">About Us</a><a class="footer-link">Press Room</a><a class="footer-link">Careers at Indeed</a>' +
      '<a class="footer-link">Privacy Policy</a><a class="footer-link">Terms of Service</a>' +
      '<a class="footer-link">Cookie Policy</a><a class="footer-link">Accessibility</a><a class="footer-link">Contact Us</a></div>' +
      '</div><div class="footer-bottom">' +
      '<p style="margin-bottom:4px;">⚠️ <strong style="color:rgba(255,255,255,0.8);">LEARNING PROJECT</strong> — This is a UI clone created for educational purposes only. Not affiliated with Indeed Inc.</p>' +
      '<p>© ' + year + ' Indeed Clone — Learning Project | Built with HTML + CSS + JavaScript | For educational use only</p>' +
      '</div></footer>'
    );
  }

  function renderBackendButton() {
    if (isFullScreenPage()) return '';
    return (
      '<div style="position:fixed;bottom:24px;left:24px;z-index:500;">' +
      '<a href="backend-code.html" class="btn btn-sm" style="background:#1e293b;color:white;border:none;box-shadow:0 4px 12px rgba(0,0,0,0.3);font-size:12px;padding:8px 14px;text-decoration:none;display:inline-flex;" title="View backend source code">🖥️ View Backend Code</a></div>'
    );
  }

  function initNavbarEvents() {
    var toggle = document.getElementById('navbar-toggle');
    var links = document.getElementById('navbar-links');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
        var bar1 = document.getElementById('bar1');
        var bar2 = document.getElementById('bar2');
        var bar3 = document.getElementById('bar3');
        if (bar1) bar1.style.transform = open ? 'rotate(45deg) translate(5px, 5px)' : 'none';
        if (bar2) bar2.style.opacity = open ? '0' : '1';
        if (bar3) bar3.style.transform = open ? 'rotate(-45deg) translate(5px, -5px)' : 'none';
      });
    }

    var logoutBtn = document.getElementById('navbar-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        IndeedAuth.logout();
        window.location.href = 'index.html';
      });
    }

    document.querySelectorAll('[data-href]').forEach(function (el) {
      el.addEventListener('click', function () {
        window.location.href = el.getAttribute('data-href');
      });
    });
  }

  function initSharedLayout() {
    IndeedSeed.seedDemoAccounts();
    IndeedAuth.restoreSession();

    var page = getCurrentPage();
    var layout = document.getElementById('app-layout');
    if (!layout) return;

    if (!isAuthPage() && !isFullScreenPage()) {
      var bannerSlot = document.getElementById('banner-slot');
      if (bannerSlot) {
        bannerSlot.innerHTML = renderLearningBanner();
        var dismissBtn = document.getElementById('dismiss-banner');
        if (dismissBtn) {
          dismissBtn.addEventListener('click', function () {
            sessionStorage.setItem('banner_dismissed', '1');
            var banner = document.getElementById('learning-banner');
            if (banner) banner.remove();
          });
        }
      }

      var navbarSlot = document.getElementById('navbar-slot');
      if (navbarSlot) {
        var renderNav = function () {
          navbarSlot.innerHTML = renderNavbar(page, IndeedAuth.getUser());
          initNavbarEvents();
        };
        renderNav();
        IndeedAuth.subscribe(renderNav);
      }

      var footerSlot = document.getElementById('footer-slot');
      if (footerSlot) footerSlot.innerHTML = renderFooter();

      var backendSlot = document.getElementById('backend-btn-slot');
      if (backendSlot) backendSlot.innerHTML = renderBackendButton();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initApp() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSharedLayout);
    } else {
      initSharedLayout();
    }
  }

  global.IndeedApp = {
    initApp: initApp,
    getCurrentPage: getCurrentPage,
    isAuthPage: isAuthPage,
    isFullScreenPage: isFullScreenPage,
  };
})(window);
