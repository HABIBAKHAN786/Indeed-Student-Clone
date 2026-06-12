/* Jobs listing, detail pane, filters, and application modal */
(function (global) {
  'use strict';

  var H = IndeedHelpers;
  var APPLICATIONS_KEY = 'indeed_applications';
  var JOBS_PER_PAGE = 8;

  var DATE_OPTIONS = [
    { value: '', label: 'Any time' },
    { value: '1', label: 'Last 24 hours' },
    { value: '3', label: 'Last 3 days' },
    { value: '7', label: 'Last 7 days' },
    { value: '14', label: 'Last 14 days' },
  ];

  var JOB_TYPE_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
  var LOCATION_OPTIONS = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Remote'];
  var SALARY_OPTIONS = [
    { value: '', label: 'Any salary' },
    { value: '50000', label: 'PKR 50K+' },
    { value: '100000', label: 'PKR 100K+' },
    { value: '150000', label: 'PKR 150K+' },
    { value: '200000', label: 'PKR 200K+' },
  ];

  function isJobSaved(jobId) {
    var user = IndeedAuth.getUser();
    return user && user.savedJobs && user.savedJobs.indexOf(jobId) !== -1;
  }

  function handleSaveToggle(e, jobId) {
    e.stopPropagation();
    var user = IndeedAuth.getUser();
    if (!user) {
      IndeedToast.showToast('Please sign in to save jobs.', 'info');
      return;
    }
    if (isJobSaved(jobId)) {
      IndeedAuth.unsaveJob(jobId);
      IndeedToast.showToast('Job removed from saved list.', 'info');
    } else {
      IndeedAuth.saveJob(jobId);
      IndeedToast.showToast('Job saved! ❤️', 'success');
    }
    document.querySelectorAll('[data-job-id="' + jobId + '"] .save-btn').forEach(function (btn) {
      var saved = isJobSaved(jobId);
      btn.classList.toggle('saved', saved);
      btn.querySelector('svg').setAttribute('fill', saved ? '#ef4444' : 'none');
      btn.querySelector('svg').setAttribute('stroke', saved ? '#ef4444' : 'currentColor');
    });
  }

  function renderJobCard(job, options) {
    options = options || {};
    var saved = isJobSaved(job._id);
    var snippet = H.truncate(H.stripMarkdown(job.description), 120);
    var skillsHtml = job.skills.slice(0, 3).map(function (s) {
      return '<span class="skill-chip">' + H.escapeHtml(s) + '</span>';
    }).join('');
    if (job.skills.length > 3) {
      skillsHtml += '<span class="skill-chip" style="background:#f3f4f6;color:#6b7280;">+' + (job.skills.length - 3) + '</span>';
    }

    return (
      '<article class="job-card' + (options.isSelected ? ' selected' : '') + '" data-job-id="' + job._id + '" role="button" tabindex="0" aria-label="' + H.escapeHtml(job.title + ' at ' + job.company) + '">' +
      '<div class="job-card-header"><div style="flex:1;margin-right:12px;">' +
      '<div class="job-card-title">' + H.escapeHtml(job.title) + '</div>' +
      '<div class="job-card-company">' + H.escapeHtml(job.company) + '</div></div>' +
      '<div class="job-card-logo" aria-hidden="true">' + (job.logo || '🏢') + '</div></div>' +
      '<div class="job-card-meta">' +
      '<span class="job-card-meta-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>' + H.escapeHtml(job.location) + '</span>' +
      '<span class="job-card-meta-item" style="color:#2d7a27;font-weight:600;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H9m0 0h4.5a1.5 1.5 0 010 3H9"/></svg>' + H.formatSalaryRange(job.salary) + '</span>' +
      '<span class="badge badge-primary">' + H.escapeHtml(job.type) + '</span>' +
      (job.remote ? '<span class="badge badge-success">Remote</span>' : '') +
      '</div><p class="job-card-snippet">' + H.escapeHtml(snippet) + '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">' + skillsHtml + '</div>' +
      '<div class="job-card-footer"><span style="font-size:12px;color:#767676;">📅 ' + H.timeAgo(job.createdAt) + '</span>' +
      '<button class="save-btn' + (saved ? ' saved' : '') + '" data-save-job="' + job._id + '" aria-label="' + (saved ? 'Remove from saved jobs' : 'Save this job') + '">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="' + (saved ? '#ef4444' : 'none') + '" stroke="' + (saved ? '#ef4444' : 'currentColor') + '" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></button></div></article>'
    );
  }

  function bindJobCardEvents(container, onSelect) {
    container.querySelectorAll('.job-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var jobId = card.getAttribute('data-job-id');
        var job = IndeedData.getJobById(jobId);
        if (job && onSelect) onSelect(job);
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') card.click();
      });
    });
    container.querySelectorAll('[data-save-job]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        handleSaveToggle(e, btn.getAttribute('data-save-job'));
      });
    });
  }

  function renderJobDetailPane(job, className) {
    className = className || '';
    if (!job) {
      return (
        '<div class="job-detail-pane right-pane ' + className + '" style="text-align:center;padding:48px;">' +
        '<div style="font-size:64px;margin-bottom:16px;">💼</div>' +
        '<h3 style="color:#767676;">Select a job to view details</h3>' +
        '<p style="color:#767676;font-size:14px;margin-top:8px;">Click on any job listing from the left to see the full description here.</p></div>'
      );
    }

    var saved = isJobSaved(job._id);
    var skillsHtml = job.skills.map(function (s) {
      return '<span class="skill-chip">' + H.escapeHtml(s) + '</span>';
    }).join('');
    var deadline = new Date(job.deadline).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
      '<div class="job-detail-pane right-pane ' + className + '" id="job-detail-pane" data-job-id="' + job._id + '">' +
      '<div style="margin-bottom:20px;">' +
      '<h1 style="font-size:22px;font-weight:800;margin-bottom:6px;color:#2d2d2d;">' + H.escapeHtml(job.title) + '</h1>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="font-size:24px;">' + (job.logo || '🏢') + '</span>' +
      '<div><div style="font-weight:700;font-size:16px;">' + H.escapeHtml(job.company) + '</div>' +
      '<div style="font-size:13px;color:#767676;">' + H.escapeHtml(job.location) + '</div></div></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">' +
      '<span class="badge badge-primary">' + H.escapeHtml(job.type) + '</span>' +
      (job.remote ? '<span class="badge badge-success">🏠 Remote</span>' : '') +
      (job.experience ? '<span class="badge badge-gray">📊 ' + H.escapeHtml(job.experience) + '</span>' : '') +
      (job.category ? '<span class="badge badge-gray">🏷️ ' + H.escapeHtml(job.category) + '</span>' : '') +
      '</div>' +
      '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:16px;">' +
      '<div style="font-size:12px;color:#6b7280;text-transform:uppercase;font-weight:600;">Salary Estimate</div>' +
      '<div style="font-size:20px;font-weight:800;color:#065f46;margin-top:2px;">' + H.formatSalaryRange(job.salary) + '</div></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      '<button class="btn btn-primary" id="apply-now-btn" style="flex:1;min-width:140px;">Apply Now →</button>' +
      '<button class="btn ' + (saved ? 'btn-danger' : 'btn-outline') + '" id="detail-save-btn" style="min-width:100px;">' + (saved ? '♥ Saved' : '♡ Save') + '</button></div>' +
      '<div style="display:flex;gap:16px;margin-top:12px;font-size:13px;color:#767676;">' +
      '<span>📅 Posted ' + H.timeAgo(job.createdAt) + '</span><span>⏰ Deadline: ' + deadline + '</span></div></div>' +
      '<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">' +
      '<div class="job-description">' + H.renderDescriptionHtml(job.description) + '</div>' +
      '<div style="margin-top:24px;"><h3 style="font-size:16px;font-weight:700;margin-bottom:12px;">Required Skills</h3>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + skillsHtml + '</div></div>' +
      '<div style="margin-top:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">' +
      '<h3 style="font-size:16px;font-weight:700;margin-bottom:12px;">About ' + H.escapeHtml(job.company) + '</h3>' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;"><span style="font-size:40px;">' + (job.logo || '🏢') + '</span>' +
      '<div><div style="font-weight:700;font-size:16px;">' + H.escapeHtml(job.company) + '</div>' +
      '<div style="font-size:13px;color:#767676;">📍 ' + H.escapeHtml(job.location) + '</div></div></div>' +
      '<p style="font-size:14px;color:#555;line-height:1.6;">' + H.escapeHtml(job.company) + ' is a leading organization based in Pakistan, offering competitive compensation and excellent growth opportunities. Join their team and be part of something impactful.</p>' +
      '<button class="btn btn-ghost btn-sm" id="company-profile-btn" style="margin-top:12px;">View Company Profile →</button></div>' +
      '<div style="margin-top:24px;text-align:center;"><button class="btn btn-primary btn-lg btn-full" id="apply-bottom-btn">Apply for this Position</button>' +
      '<p style="font-size:12px;color:#767676;margin-top:8px;">By applying, you agree to our Terms of Service</p></div></div>'
    );
  }

  function bindDetailPaneEvents(job) {
    var saveBtn = document.getElementById('detail-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var user = IndeedAuth.getUser();
        if (!user) {
          IndeedToast.showToast('Please sign in to save jobs.', 'info');
          return;
        }
        if (isJobSaved(job._id)) {
          IndeedAuth.unsaveJob(job._id);
          IndeedToast.showToast('Job removed from saved list.', 'info');
          saveBtn.className = 'btn btn-outline';
          saveBtn.textContent = '♡ Save';
        } else {
          IndeedAuth.saveJob(job._id);
          IndeedToast.showToast('Job saved! ❤️', 'success');
          saveBtn.className = 'btn btn-danger';
          saveBtn.textContent = '♥ Saved';
        }
      });
    }

    function handleApply() {
      var user = IndeedAuth.getUser();
      if (!user) {
        IndeedToast.showToast('Please sign in to apply for jobs.', 'info');
        window.location.href = 'login.html';
        return;
      }
      if (user.role === 'employer') {
        IndeedToast.showToast('Employers cannot apply for jobs.', 'warning');
        return;
      }
      openApplicationModal(job);
    }

    var applyBtn = document.getElementById('apply-now-btn');
    var applyBottom = document.getElementById('apply-bottom-btn');
    if (applyBtn) applyBtn.addEventListener('click', handleApply);
    if (applyBottom) applyBottom.addEventListener('click', handleApply);

    var companyBtn = document.getElementById('company-profile-btn');
    if (companyBtn) {
      companyBtn.addEventListener('click', function () {
        IndeedToast.showToast('Company profile coming soon!', 'info');
      });
    }
  }

  function openApplicationModal(job) {
    var existing = document.getElementById('application-modal');
    if (existing) existing.remove();

    var user = IndeedAuth.getUser();
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'application-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML =
      '<div class="modal-box"><div class="modal-header"><div>' +
      '<h2 id="modal-title" style="font-size:18px;font-weight:800;">Apply for Position</h2>' +
      '<p style="font-size:13px;color:#767676;margin-top:2px;">' + H.escapeHtml(job.title) + ' · ' + H.escapeHtml(job.company) + '</p></div>' +
      '<button class="modal-close" id="modal-close-btn" aria-label="Close application form">✕</button></div>' +
      '<form id="application-form">' +
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:14px;">' +
      '<div style="font-weight:600;margin-bottom:4px;">Applying as: ' + H.escapeHtml(user.name) + '</div>' +
      '<div style="color:#767676;">' + H.escapeHtml(user.email) + '</div></div>' +
      '<div class="form-group"><label class="form-label" for="resume">Resume / CV (PDF, max 5MB)</label>' +
      (user.resumeUrl ? '<div style="font-size:13px;color:#2d7a27;margin-bottom:8px;display:flex;align-items:center;gap:6px;">✅ Using your uploaded CV: ' + H.escapeHtml(user.resumeUrl) + '</div>' : '') +
      '<div id="resume-drop" style="border:2px dashed #d4d2d0;border-radius:8px;padding:24px;text-align:center;cursor:pointer;position:relative;">' +
      '<input id="resume" type="file" accept=".pdf" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">' +
      '<div id="resume-content"><div style="font-size:32px;margin-bottom:8px;">📄</div>' +
      '<div style="font-weight:600;margin-bottom:4px;">Drop your PDF here or click to browse</div>' +
      '<div style="font-size:12px;color:#767676;">PDF format · Maximum 5MB</div></div></div></div>' +
      '<div class="form-group"><label class="form-label" for="cover-letter">Cover Letter <span style="color:#ef4444;">*</span></label>' +
      '<textarea id="cover-letter" class="form-textarea" placeholder="Dear Hiring Manager at ' + H.escapeHtml(job.company) + ',\n\nI am excited to apply for the ' + H.escapeHtml(job.title) + ' position..." style="min-height:150px;" maxlength="1000"></textarea>' +
      '<div style="font-size:12px;color:#767676;text-align:right;"><span id="cover-count">0</span>/1000 characters</div></div>' +
      '<div id="app-error" class="form-error" style="display:none;margin-bottom:16px;"></div>' +
      '<div style="display:flex;gap:12px;"><button type="button" class="btn btn-ghost" id="cancel-apply" style="flex:1;">Cancel</button>' +
      '<button type="submit" class="btn btn-primary" id="submit-apply" style="flex:2;">Submit Application</button></div></form></div>';

    document.body.appendChild(overlay);

    var resumeFile = null;
    var coverLetter = document.getElementById('cover-letter');
    var coverCount = document.getElementById('cover-count');

    coverLetter.addEventListener('input', function () {
      coverCount.textContent = coverLetter.value.length;
    });

    function closeModal() {
      overlay.remove();
    }

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-apply').addEventListener('click', closeModal);

    function handleFile(file) {
      if (!file) return;
      if (file.type !== 'application/pdf') {
        document.getElementById('app-error').style.display = 'block';
        document.getElementById('app-error').textContent = '⚠️ Please upload a PDF file only.';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        document.getElementById('app-error').style.display = 'block';
        document.getElementById('app-error').textContent = '⚠️ File size must be less than 5MB.';
        return;
      }
      resumeFile = file;
      document.getElementById('app-error').style.display = 'none';
      document.getElementById('resume-content').innerHTML =
        '<div style="font-weight:600;color:#065f46;">✅ ' + H.escapeHtml(file.name) + '</div>' +
        '<div style="font-size:12px;color:#767676;">' + (file.size / 1024).toFixed(0) + ' KB</div>';
    }

    document.getElementById('resume').addEventListener('change', function (e) {
      handleFile(e.target.files[0]);
    });

    document.getElementById('resume-drop').addEventListener('dragover', function (e) {
      e.preventDefault();
    });
    document.getElementById('resume-drop').addEventListener('drop', function (e) {
      e.preventDefault();
      handleFile(e.dataTransfer.files[0]);
    });

    document.getElementById('application-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var errorEl = document.getElementById('app-error');
      var letter = coverLetter.value.trim();
      if (!letter) {
        errorEl.style.display = 'block';
        errorEl.textContent = '⚠️ Please write a cover letter.';
        return;
      }
      if (letter.length < 50) {
        errorEl.style.display = 'block';
        errorEl.textContent = '⚠️ Cover letter must be at least 50 characters.';
        return;
      }

      var submitBtn = document.getElementById('submit-apply');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span style="display:flex;align-items:center;gap:8px;"><span class="spinner"></span>Submitting...</span>';

      setTimeout(function () {
        var applications = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
        var alreadyApplied = applications.some(function (app) {
          return app.jobId === job._id && app.applicantId === user._id;
        });
        if (alreadyApplied) {
          errorEl.style.display = 'block';
          errorEl.textContent = '⚠️ You have already applied for this position.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Application';
          return;
        }

        applications.push({
          _id: 'app_' + Date.now(),
          jobId: job._id,
          job: job,
          applicantId: user._id,
          applicant: user,
          coverLetter: letter,
          resumeUrl: resumeFile ? resumeFile.name : (user.resumeUrl || 'resume.pdf'),
          status: 'pending',
          appliedAt: new Date().toISOString(),
        });
        localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));

        overlay.querySelector('.modal-box').innerHTML =
          '<div style="text-align:center;padding:32px 16px;"><div style="font-size:56px;margin-bottom:16px;">🎉</div>' +
          '<h3 style="font-size:20px;font-weight:700;margin-bottom:8px;">Application Submitted!</h3>' +
          '<p style="color:#767676;margin-bottom:24px;line-height:1.6;">Your application for <strong>' + H.escapeHtml(job.title) + '</strong> at <strong>' + H.escapeHtml(job.company) + '</strong> has been successfully submitted.</p>' +
          '<p style="font-size:13px;color:#767676;margin-bottom:20px;">Track your application status in your <strong style="color:#2557a7;">Dashboard → My Applications</strong></p>' +
          '<button class="btn btn-primary" id="done-apply">Done</button></div>';
        document.getElementById('done-apply').addEventListener('click', closeModal);
        IndeedToast.showToast('Application submitted to ' + job.company + '! 🎉', 'success');
      }, 1200);
    });
  }

  function filterJobs(allJobs, filters) {
    return allJobs.filter(function (job) {
      if (filters.search) {
        var q = filters.search.toLowerCase();
        var matches =
          job.title.toLowerCase().indexOf(q) !== -1 ||
          job.company.toLowerCase().indexOf(q) !== -1 ||
          job.description.toLowerCase().indexOf(q) !== -1 ||
          job.skills.some(function (s) { return s.toLowerCase().indexOf(q) !== -1; });
        if (!matches) return false;
      }
      if (filters.location) {
        var loc = filters.location.toLowerCase();
        if (job.location.toLowerCase().indexOf(loc) === -1) return false;
      }
      if (filters.type && job.type !== filters.type) return false;
      if (filters.salary) {
        var minSalary = parseInt(filters.salary, 10);
        if (job.salary.max < minSalary) return false;
      }
      if (filters.datePosted) {
        var daysAgo = parseInt(filters.datePosted, 10);
        var postedDate = new Date(job.createdAt);
        var cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysAgo);
        if (postedDate < cutoff) return false;
      }
      if (filters.remote === 'remote' && !job.remote) return false;
      if (filters.remote === 'onsite' && job.remote) return false;
      return true;
    });
  }

  function initJobsPage() {
    var params = H.getQueryParams();
    var state = {
      filters: {
        search: params.search || '',
        location: params.location || '',
        type: '',
        datePosted: '',
        salary: '',
        remote: '',
      },
      searchInput: params.search || '',
      locationInput: params.location || '',
      selectedJob: null,
      currentPage: 1,
      showMobileFilters: false,
    };

    var searchInputEl = document.getElementById('jobs-search-input');
    var locationInputEl = document.getElementById('jobs-location-input');
    var jobsListEl = document.getElementById('jobs-list');
    var detailPaneEl = document.getElementById('jobs-detail-pane');
    var resultsCountEl = document.getElementById('results-count');
    var resultsLabelEl = document.getElementById('results-label');
    var paginationEl = document.getElementById('pagination');
    var filterSidebar = document.getElementById('filter-sidebar');

    if (searchInputEl) searchInputEl.value = state.searchInput;
    if (locationInputEl) locationInputEl.value = state.locationInput;

    var debouncedSetSearch = H.debounce(function (value) {
      state.filters.search = value;
      state.currentPage = 1;
      render();
    }, 400);

    var debouncedSetLocation = H.debounce(function (value) {
      state.filters.location = value;
      state.currentPage = 1;
      render();
    }, 400);

    function renderFilters() {
      var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<h2 style="font-size:16px;font-weight:700;">🔍 Filter Jobs</h2>';
      var hasActive = state.filters.type || state.filters.datePosted || state.filters.salary || state.filters.remote;
      if (hasActive) {
        html += '<button id="clear-filters" style="font-size:12px;color:#2557a7;font-weight:600;background:none;border:none;cursor:pointer;">Clear All</button>';
      }
      html += '</div>';

      html += '<div class="filter-section"><div class="filter-title">📅 Date Posted</div>';
      DATE_OPTIONS.forEach(function (opt) {
        html += '<label class="filter-option"><input type="radio" name="datePosted" value="' + opt.value + '"' + (state.filters.datePosted === opt.value ? ' checked' : '') + '> ' + opt.label + '</label>';
      });
      html += '</div><div class="filter-section"><div class="filter-title">💼 Job Type</div>';
      JOB_TYPE_OPTIONS.forEach(function (type) {
        html += '<label class="filter-option"><input type="checkbox" data-filter-type="' + type + '"' + (state.filters.type === type ? ' checked' : '') + '> ' + type + '</label>';
      });
      html += '</div><div class="filter-section"><div class="filter-title">💰 Salary Estimate</div>';
      SALARY_OPTIONS.forEach(function (opt) {
        html += '<label class="filter-option"><input type="radio" name="salary" value="' + opt.value + '"' + (state.filters.salary === opt.value ? ' checked' : '') + '> ' + opt.label + '</label>';
      });
      html += '</div><div class="filter-section"><div class="filter-title">📍 Location</div>';
      LOCATION_OPTIONS.forEach(function (loc) {
        html += '<label class="filter-option"><input type="checkbox" data-filter-location="' + loc + '"' + (state.filters.location === loc ? ' checked' : '') + '> ' + loc + '</label>';
      });
      html += '</div><div class="filter-section"><div class="filter-title">🏠 Work Mode</div>' +
        '<label class="filter-option"><input type="radio" name="remote" value=""' + (state.filters.remote === '' ? ' checked' : '') + '> All</label>' +
        '<label class="filter-option"><input type="radio" name="remote" value="remote"' + (state.filters.remote === 'remote' ? ' checked' : '') + '> Remote only</label>' +
        '<label class="filter-option"><input type="radio" name="remote" value="onsite"' + (state.filters.remote === 'onsite' ? ' checked' : '') + '> On-site only</label></div>';

      filterSidebar.innerHTML = html;

      filterSidebar.querySelectorAll('input[name="datePosted"]').forEach(function (input) {
        input.addEventListener('change', function () {
          state.filters.datePosted = input.value;
          state.currentPage = 1;
          render();
        });
      });
      filterSidebar.querySelectorAll('[data-filter-type]').forEach(function (input) {
        input.addEventListener('change', function () {
          state.filters.type = input.checked ? input.getAttribute('data-filter-type') : '';
          state.currentPage = 1;
          render();
        });
      });
      filterSidebar.querySelectorAll('input[name="salary"]').forEach(function (input) {
        input.addEventListener('change', function () {
          state.filters.salary = input.value;
          state.currentPage = 1;
          render();
        });
      });
      filterSidebar.querySelectorAll('[data-filter-location]').forEach(function (input) {
        input.addEventListener('change', function () {
          state.filters.location = input.checked ? input.getAttribute('data-filter-location') : '';
          state.locationInput = state.filters.location;
          if (locationInputEl) locationInputEl.value = state.locationInput;
          state.currentPage = 1;
          render();
        });
      });
      filterSidebar.querySelectorAll('input[name="remote"]').forEach(function (input) {
        input.addEventListener('change', function () {
          state.filters.remote = input.value;
          state.currentPage = 1;
          render();
        });
      });
      var clearBtn = document.getElementById('clear-filters');
      if (clearBtn) {
        clearBtn.addEventListener('click', function () {
          state.filters = { search: '', location: '', type: '', datePosted: '', salary: '', remote: '' };
          state.searchInput = '';
          state.locationInput = '';
          if (searchInputEl) searchInputEl.value = '';
          if (locationInputEl) locationInputEl.value = '';
          state.currentPage = 1;
          render();
        });
      }
    }

    function render() {
      renderFilters();
      var filtered = filterJobs(IndeedData.getAllJobs(), state.filters);
      var totalPages = Math.ceil(filtered.length / JOBS_PER_PAGE) || 1;
      if (state.currentPage > totalPages) state.currentPage = totalPages;
      var paginated = filtered.slice((state.currentPage - 1) * JOBS_PER_PAGE, state.currentPage * JOBS_PER_PAGE);

      if (!state.selectedJob && paginated.length) state.selectedJob = paginated[0];
      if (state.selectedJob && !paginated.find(function (j) { return j._id === state.selectedJob._id; })) {
        state.selectedJob = paginated[0] || null;
      }

      resultsCountEl.textContent = filtered.length.toLocaleString();
      var label = ' jobs';
      if (state.filters.search) label += ' for "' + state.filters.search + '"';
      if (state.filters.location) label += ' in ' + state.filters.location;
      resultsLabelEl.textContent = label;

      if (paginated.length) {
        jobsListEl.innerHTML = paginated.map(function (job) {
          return renderJobCard(job, { isSelected: state.selectedJob && state.selectedJob._id === job._id });
        }).join('');
        bindJobCardEvents(jobsListEl, function (job) {
          state.selectedJob = job;
          render();
        });
      } else {
        jobsListEl.innerHTML =
          '<div class="no-results"><div class="no-results-icon">🔍</div><div class="no-results-title">No jobs found</div>' +
          '<p style="color:#767676;margin-bottom:16px;">Try adjusting your search terms or removing some filters.</p>' +
          '<button class="btn btn-outline" id="no-results-clear">Clear All Filters</button></div>';
        document.getElementById('no-results-clear').addEventListener('click', function () {
          state.filters = { search: '', location: '', type: '', datePosted: '', salary: '', remote: '' };
          state.searchInput = '';
          state.locationInput = '';
          if (searchInputEl) searchInputEl.value = '';
          if (locationInputEl) locationInputEl.value = '';
          state.currentPage = 1;
          render();
        });
        state.selectedJob = null;
      }

      detailPaneEl.innerHTML = renderJobDetailPane(state.selectedJob);
      if (state.selectedJob) bindDetailPaneEvents(state.selectedJob);

      if (totalPages > 1) {
        var pagesHtml = '<button class="page-btn" id="page-prev" ' + (state.currentPage === 1 ? 'disabled' : '') + ' aria-label="Previous page">‹</button>';
        for (var i = 1; i <= totalPages; i++) {
          pagesHtml += '<button class="page-btn' + (state.currentPage === i ? ' active' : '') + '" data-page="' + i + '" aria-label="Page ' + i + '">' + i + '</button>';
        }
        pagesHtml += '<button class="page-btn" id="page-next" ' + (state.currentPage === totalPages ? 'disabled' : '') + ' aria-label="Next page">›</button>';
        paginationEl.innerHTML = pagesHtml;
        paginationEl.style.display = 'flex';

        document.getElementById('page-prev').addEventListener('click', function () {
          if (state.currentPage > 1) {
            state.currentPage--;
            state.selectedJob = null;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            render();
          }
        });
        document.getElementById('page-next').addEventListener('click', function () {
          if (state.currentPage < totalPages) {
            state.currentPage++;
            state.selectedJob = null;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            render();
          }
        });
        paginationEl.querySelectorAll('[data-page]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            state.currentPage = parseInt(btn.getAttribute('data-page'), 10);
            state.selectedJob = null;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            render();
          });
        });
      } else {
        paginationEl.innerHTML = '';
        paginationEl.style.display = 'none';
      }
    }

    if (searchInputEl) {
      searchInputEl.addEventListener('input', function () {
        state.searchInput = searchInputEl.value;
        debouncedSetSearch(searchInputEl.value);
      });
    }
    if (locationInputEl) {
      locationInputEl.addEventListener('input', function () {
        state.locationInput = locationInputEl.value;
        debouncedSetLocation(locationInputEl.value);
      });
    }

    document.getElementById('jobs-search-form').addEventListener('submit', function (e) {
      e.preventDefault();
      state.filters.search = state.searchInput;
      state.filters.location = state.locationInput;
      state.currentPage = 1;
      render();
    });

    var clearSearch = document.getElementById('clear-search');
    var clearLocation = document.getElementById('clear-location');
    if (clearSearch) {
      clearSearch.addEventListener('click', function () {
        state.searchInput = '';
        searchInputEl.value = '';
        state.filters.search = '';
        render();
      });
    }
    if (clearLocation) {
      clearLocation.addEventListener('click', function () {
        state.locationInput = '';
        locationInputEl.value = '';
        state.filters.location = '';
        render();
      });
    }

    var mobileToggle = document.getElementById('mobile-filter-toggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', function () {
        state.showMobileFilters = !state.showMobileFilters;
        filterSidebar.classList.toggle('open', state.showMobileFilters);
        mobileToggle.textContent = state.showMobileFilters ? '▲ Hide Filters' : '▼ Show Filters';
      });
    }

    render();
  }

  function initJobDetailPage() {
    var params = H.getQueryParams();
    var job = IndeedData.getJobById(params.id);
    if (!job) {
      window.location.href = 'jobs.html';
      return;
    }

    var detailContainer = document.getElementById('job-detail-main');
    var sidebarEl = document.getElementById('job-detail-sidebar');
    var breadcrumbTitle = document.getElementById('breadcrumb-title');
    if (breadcrumbTitle) breadcrumbTitle.textContent = job.title;

    var selectedSimilar = null;

    function renderMain() {
      var displayJob = selectedSimilar || job;
      detailContainer.innerHTML = renderJobDetailPane(displayJob);
      bindDetailPaneEvents(displayJob);
    }

    function renderSidebar() {
      var similarJobs = IndeedData.getAllJobs().filter(function (j) {
        return j._id !== job._id && (j.category === job.category || j.location === job.location);
      }).slice(0, 4);

      var overviewItems = [
        { label: 'Job Type', value: job.type, icon: '💼' },
        { label: 'Location', value: job.location, icon: '📍' },
        { label: 'Experience', value: job.experience || 'Not specified', icon: '📈' },
        { label: 'Category', value: job.category || 'General', icon: '🏷️' },
        { label: 'Deadline', value: new Date(job.deadline).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }), icon: '⏰' },
        { label: 'Work Mode', value: job.remote ? 'Remote' : 'On-site', icon: '🏠' },
      ];

      var html =
        '<div class="card" style="margin-bottom:20px;"><h3 style="font-size:15px;font-weight:700;margin-bottom:16px;">📊 Job Overview</h3>';
      overviewItems.forEach(function (item) {
        html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;">' +
          '<span style="color:#767676;">' + item.icon + ' ' + item.label + '</span><span style="font-weight:600;">' + H.escapeHtml(item.value) + '</span></div>';
      });
      html += '</div><div class="card" style="margin-bottom:20px;"><h3 style="font-size:15px;font-weight:700;margin-bottom:12px;">📤 Share This Job</h3>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
      [
        { label: 'WhatsApp', emoji: '💬', color: '#25D366' },
        { label: 'LinkedIn', emoji: '💼', color: '#0077b5' },
        { label: 'Email', emoji: '📧', color: '#2557a7' },
        { label: 'Copy Link', emoji: '🔗', color: '#6b7280' },
      ].forEach(function (share) {
        html += '<button class="btn btn-sm share-btn" data-share="' + share.label + '" style="flex:1;background:' + share.color + '15;color:' + share.color + ';border:1px solid ' + share.color + '40;">' + share.emoji + ' ' + share.label + '</button>';
      });
      html += '</div></div>';

      if (similarJobs.length) {
        html += '<div><h3 style="font-size:15px;font-weight:700;margin-bottom:12px;">🔍 Similar Jobs</h3><div style="display:flex;flex-direction:column;gap:10px;">';
        similarJobs.forEach(function (sj) {
          html += '<div class="similar-job" data-similar-id="' + sj._id + '" style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:12px;cursor:pointer;">' +
            '<div style="display:flex;gap:10px;align-items:flex-start;"><span style="font-size:24px;">' + (sj.logo || '🏢') + '</span>' +
            '<div style="flex:1;min-width:0;"><div style="font-weight:700;font-size:13px;color:#2557a7;margin-bottom:2px;">' + H.escapeHtml(sj.title) + '</div>' +
            '<div style="font-size:12px;color:#767676;">' + H.escapeHtml(sj.company) + '</div>' +
            '<div style="font-size:12px;color:#767676;">📍 ' + H.escapeHtml(sj.location) + '</div></div></div></div>';
        });
        html += '</div><button class="btn btn-outline btn-sm btn-full" id="view-similar-all" style="margin-top:12px;">View All Similar Jobs →</button></div>';
      }

      sidebarEl.innerHTML = html;

      sidebarEl.querySelectorAll('.share-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
          alert('Shared via ' + btn.getAttribute('data-share') + '!');
        });
      });

      sidebarEl.querySelectorAll('.similar-job').forEach(function (el) {
        el.addEventListener('click', function () {
          selectedSimilar = IndeedData.getJobById(el.getAttribute('data-similar-id'));
          renderMain();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        el.addEventListener('mouseenter', function () { el.style.borderColor = '#2557a7'; });
        el.addEventListener('mouseleave', function () { el.style.borderColor = '#e5e7eb'; });
      });

      var viewAll = document.getElementById('view-similar-all');
      if (viewAll) {
        viewAll.addEventListener('click', function () {
          window.location.href = 'jobs.html?search=' + encodeURIComponent(job.title);
        });
      }
    }

    renderMain();
    renderSidebar();
  }

  function initHomeJobCards() {
    var container = document.getElementById('home-jobs-grid');
    if (!container) return;
    var jobs = IndeedData.MOCK_JOBS.slice(0, 6);
    container.innerHTML = jobs.map(function (job) {
      return renderJobCard(job);
    }).join('');
    bindJobCardEvents(container, function (job) {
      window.location.href = 'job-detail.html?id=' + encodeURIComponent(job._id);
    });
  }

  global.IndeedJobs = {
    renderJobCard: renderJobCard,
    renderJobDetailPane: renderJobDetailPane,
    openApplicationModal: openApplicationModal,
    initJobsPage: initJobsPage,
    initJobDetailPage: initJobDetailPage,
    initHomeJobCards: initHomeJobCards,
    filterJobs: filterJobs,
  };
})(window);
