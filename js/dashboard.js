/* Seeker and employer dashboard logic */
(function (global) {
  'use strict';

  var H = IndeedHelpers;
  var EMPLOYER_JOBS_KEY = 'indeed_employer_jobs';
  var APPLICATIONS_KEY = 'indeed_applications';

  function loadApplications(userId) {
    try {
      var stored = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
      return stored.filter(function (app) {
        return app.applicantId === userId;
      });
    } catch (e) {
      return [];
    }
  }

  function initSeekerDashboard() {
    var user = IndeedAuth.getUser();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    if (user.role !== 'seeker') {
      window.location.href = 'employer-dashboard.html';
      return;
    }

    var activeSection = 'overview';
    var applications = loadApplications(user._id);

    function getSavedJobs() {
      return IndeedData.getAllJobs().filter(function (j) {
        return user.savedJobs && user.savedJobs.indexOf(j._id) !== -1;
      });
    }

    function setSection(section) {
      activeSection = section;
      document.querySelectorAll('.dashboard-sidebar-link').forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('data-section') === section);
      });
      renderContent();
    }

    document.querySelectorAll('.dashboard-sidebar-link').forEach(function (link) {
      link.addEventListener('click', function () {
        setSection(link.getAttribute('data-section'));
      });
    });

    document.querySelectorAll('[data-goto-section]').forEach(function (el) {
      el.addEventListener('click', function () {
        setSection(el.getAttribute('data-goto-section'));
      });
    });

    function renderContent() {
      var content = document.getElementById('dashboard-content');
      var savedJobs = getSavedJobs();
      applications = loadApplications(user._id);
      user = IndeedAuth.getUser();

      if (activeSection === 'overview') {
        content.innerHTML = renderSeekerOverview(user, applications, savedJobs);
        bindOverviewEvents();
      } else if (activeSection === 'profile') {
        content.innerHTML = renderProfileSection(user);
        bindProfileForm(user);
      } else if (activeSection === 'resume') {
        content.innerHTML = renderResumeSection(user);
        bindResumeForm(user);
      } else if (activeSection === 'saved') {
        content.innerHTML = renderSavedJobs(savedJobs);
      } else if (activeSection === 'applications') {
        content.innerHTML = renderApplicationsTable(applications);
      }
    }

    function renderSeekerOverview(user, apps, savedJobs) {
      var incomplete = !user.phone || !user.bio || !user.skills.length;
      var html =
        '<h1 style="font-size:22px;font-weight:800;margin-bottom:4px;">Welcome back, ' + H.escapeHtml(user.name.split(' ')[0]) + '! 👋</h1>' +
        '<p style="color:#767676;margin-bottom:24px;">Here\'s a summary of your job search activity.</p>' +
        '<div class="stats-grid">' +
        '<div class="stat-card"><div class="stat-card-number">' + apps.length + '</div><div class="stat-card-label">Applications Sent</div></div>' +
        '<div class="stat-card"><div class="stat-card-number">' + savedJobs.length + '</div><div class="stat-card-label">Saved Jobs</div></div>' +
        '<div class="stat-card"><div class="stat-card-number" style="color:#10b981;">' + apps.filter(function (a) { return a.status === 'accepted'; }).length + '</div><div class="stat-card-label">Offers Received</div></div>' +
        '<div class="stat-card"><div class="stat-card-number" style="color:#f59e0b;">' + apps.filter(function (a) { return a.status === 'reviewed'; }).length + '</div><div class="stat-card-label">Under Review</div></div></div>';

      if (incomplete) {
        html += '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:20px;">' +
          '<h3 style="font-size:16px;font-weight:700;margin-bottom:8px;">⚡ Complete your profile to get noticed!</h3>' +
          '<p style="font-size:14px;color:#767676;margin-bottom:12px;">Profiles with all fields filled get 3x more views from employers.</p>' +
          '<button class="btn btn-primary btn-sm" data-goto-section="profile">Complete Profile →</button></div>';
      }

      if (apps.length) {
        html += '<div class="dashboard-card"><h2 class="dashboard-section-title">Recent Applications</h2>';
        apps.slice(0, 3).forEach(function (app) {
          html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f3f4f6;">' +
            '<div><div style="font-weight:600;font-size:14px;">' + H.escapeHtml((app.job && app.job.title) || 'Job Title') + '</div>' +
            '<div style="font-size:12px;color:#767676;">' + H.escapeHtml((app.job && app.job.company) || '') + ' · ' + H.timeAgo(app.appliedAt) + '</div></div>' +
            '<span class="badge" style="background:' + H.getStatusColor(app.status) + '20;color:' + H.getStatusColor(app.status) + ';">' + app.status + '</span></div>';
        });
        html += '<button class="btn btn-outline btn-sm" style="margin-top:12px;" data-goto-section="applications">View All Applications →</button></div>';
      }

      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div class="card" style="cursor:pointer;text-align:center;" id="goto-jobs"><div style="font-size:32px;margin-bottom:8px;">🔍</div>' +
        '<div style="font-weight:600;">Find New Jobs</div><div style="font-size:12px;color:#767676;">Browse ' + IndeedData.MOCK_JOBS.length + '+ listings</div></div>' +
        '<div class="card" style="cursor:pointer;text-align:center;" data-goto-section="resume"><div style="font-size:32px;margin-bottom:8px;">📄</div>' +
        '<div style="font-weight:600;">Upload Resume</div><div style="font-size:12px;color:#767676;">' + (user.resumeUrl ? '✅ Uploaded' : 'Not uploaded yet') + '</div></div></div>';
      return html;
    }

    function bindOverviewEvents() {
      document.querySelectorAll('[data-goto-section]').forEach(function (el) {
        el.addEventListener('click', function () { setSection(el.getAttribute('data-goto-section')); });
      });
      var gotoJobs = document.getElementById('goto-jobs');
      if (gotoJobs) gotoJobs.addEventListener('click', function () { window.location.href = 'jobs.html'; });
    }

    function renderProfileSection(user) {
      var skillsHtml = (user.skills || []).map(function (skill) {
        return '<span class="skill-tag" data-skill="' + H.escapeHtml(skill) + '" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#e8f0fe;color:#2557a7;border-radius:20px;font-size:13px;font-weight:500;">' +
          H.escapeHtml(skill) + ' <button type="button" class="remove-skill" style="background:none;border:none;cursor:pointer;color:#2557a7;font-weight:700;">×</button></span>';
      }).join('');

      return (
        '<h2 class="dashboard-section-title">👤 My Profile</h2><div class="dashboard-card"><form id="profile-form">' +
        '<div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;"><div class="avatar avatar-lg">' + user.name.charAt(0).toUpperCase() + '</div>' +
        '<div><h3 style="font-size:18px;font-weight:700;">' + H.escapeHtml(user.name) + '</h3><p style="font-size:13px;color:#767676;">' + H.escapeHtml(user.email) + '</p>' +
        '<p style="font-size:12px;color:#767676;">Member since ' + new Date(user.createdAt).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' }) + '</p></div></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;"><div class="form-group"><label class="form-label">Full Name *</label>' +
        '<input class="form-input" id="profile-name" value="' + H.escapeHtml(user.name) + '"></div>' +
        '<div class="form-group"><label class="form-label">Phone Number</label>' +
        '<input class="form-input" id="profile-phone" value="' + H.escapeHtml(user.phone || '') + '" type="tel"></div></div>' +
        '<div class="form-group"><label class="form-label">Professional Bio</label>' +
        '<textarea class="form-textarea" id="profile-bio" maxlength="500">' + H.escapeHtml(user.bio || '') + '</textarea>' +
        '<div style="font-size:12px;color:#767676;text-align:right;"><span id="bio-count">' + (user.bio || '').length + '</span>/500</div></div>' +
        '<div class="form-group"><label class="form-label">Skills (max 15)</label>' +
        '<div style="display:flex;gap:8px;margin-bottom:10px;"><input class="form-input" id="skill-input" placeholder="e.g. React, Python, Excel...">' +
        '<button type="button" class="btn btn-outline" id="add-skill">Add</button></div>' +
        '<div id="skills-container" style="display:flex;flex-wrap:wrap;gap:8px;">' + skillsHtml + '</div></div>' +
        '<button type="submit" class="btn btn-primary" id="profile-save">💾 Save Profile</button></form></div>'
      );
    }

    function bindProfileForm() {
      var form = document.getElementById('profile-form');
      var skills = (IndeedAuth.getUser().skills || []).slice();
      var bio = document.getElementById('profile-bio');
      var bioCount = document.getElementById('bio-count');

      bio.addEventListener('input', function () { bioCount.textContent = bio.value.length; });

      function renderSkills() {
        var container = document.getElementById('skills-container');
        container.innerHTML = skills.map(function (skill) {
          return '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#e8f0fe;color:#2557a7;border-radius:20px;font-size:13px;font-weight:500;">' +
            H.escapeHtml(skill) + ' <button type="button" data-remove-skill="' + H.escapeHtml(skill) + '" style="background:none;border:none;cursor:pointer;color:#2557a7;font-weight:700;">×</button></span>';
        }).join('');
        container.querySelectorAll('[data-remove-skill]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            skills = skills.filter(function (s) { return s !== btn.getAttribute('data-remove-skill'); });
            renderSkills();
          });
        });
      }

      document.getElementById('add-skill').addEventListener('click', function () {
        var input = document.getElementById('skill-input');
        var trimmed = input.value.trim();
        if (trimmed && skills.indexOf(trimmed) === -1 && skills.length < 15) {
          skills.push(trimmed);
          input.value = '';
          renderSkills();
        }
      });

      document.getElementById('skill-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('add-skill').click(); }
      });

      renderSkills();

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = document.getElementById('profile-name').value.trim();
        if (!name) { IndeedToast.showToast('Name cannot be empty.', 'error'); return; }
        var btn = document.getElementById('profile-save');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Saving...';
        setTimeout(function () {
          IndeedAuth.updateProfile({
            name: name,
            phone: document.getElementById('profile-phone').value.trim(),
            bio: bio.value.trim(),
            skills: skills,
          });
          IndeedToast.showToast('Profile updated successfully! ✅', 'success');
          btn.disabled = false;
          btn.textContent = '💾 Save Profile';
          user = IndeedAuth.getUser();
        }, 800);
      });
    }

    function renderResumeSection(user) {
      var hasResume = !!user.resumeUrl;
      return (
        '<h2 class="dashboard-section-title">📄 Resume / CV</h2><div class="dashboard-card">' +
        '<p style="font-size:14px;color:#767676;margin-bottom:20px;">Upload your resume so employers can find and download it. <strong style="color:#2557a7;">PDF format only, max 5MB.</strong></p>' +
        (hasResume ?
          '<div id="resume-status" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">' +
          '<span style="font-size:32px;">📄</span><div style="flex:1;"><div style="font-weight:700;color:#065f46;">Resume Uploaded</div>' +
          '<div style="font-size:13px;color:#047857;" id="resume-filename">' + H.escapeHtml(user.resumeUrl) + '</div></div>' +
          '<button class="btn btn-ghost btn-sm" id="remove-resume">Remove</button></div>' :
          '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin-bottom:20px;">' +
          '<p style="font-size:14px;color:#9a3412;font-weight:600;">⚠️ No resume uploaded yet!</p>' +
          '<p style="font-size:13px;color:#c2410c;">Candidates with a resume are 5x more likely to be contacted by employers.</p></div>') +
        '<div id="resume-upload-area" style="border:2px dashed #d4d2d0;border-radius:12px;padding:40px;text-align:center;cursor:pointer;position:relative;">' +
        '<input type="file" accept=".pdf" id="resume-upload" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">' +
        '<div id="upload-content"><div style="font-size:48px;margin-bottom:12px;">☁️</div>' +
        '<div style="font-weight:700;font-size:16px;margin-bottom:8px;">' + (hasResume ? 'Upload a new resume' : 'Upload your resume') + '</div>' +
        '<div style="font-size:13px;color:#767676;margin-bottom:16px;">Drag & drop your PDF here, or click to browse files</div>' +
        '<button type="button" class="btn btn-primary btn-sm">Choose PDF File</button></div></div>' +
        '<div style="margin-top:20px;"><h4 style="font-size:14px;font-weight:700;margin-bottom:8px;">💡 Resume Tips:</h4>' +
        '<ul style="list-style:disc;padding-left:20px;font-size:13px;color:#767676;line-height:2;">' +
        '<li>Keep it to 1-2 pages maximum</li><li>Use a clean, ATS-friendly format</li>' +
        '<li>Include key skills matching the job descriptions</li>' +
        '<li>List achievements with numbers (e.g., "Increased sales by 40%")</li>' +
        '<li>Update it regularly with new experience</li></ul></div></div>'
      );
    }

    function bindResumeForm() {
      var upload = document.getElementById('resume-upload');
      var removeBtn = document.getElementById('remove-resume');

      function handleUpload(file) {
        if (!file) return;
        if (file.type !== 'application/pdf') { IndeedToast.showToast('Please upload a PDF file only.', 'error'); return; }
        if (file.size > 5 * 1024 * 1024) { IndeedToast.showToast('File must be less than 5MB.', 'error'); return; }
        document.getElementById('upload-content').innerHTML = '<div class="spinner spinner-dark" style="margin:0 auto 16px;width:40px;height:40px;border-width:3px;"></div><div style="font-weight:600;color:#2557a7;">Uploading your resume...</div>';
        setTimeout(function () {
          IndeedAuth.updateProfile({ resumeUrl: file.name });
          IndeedToast.showToast('Resume uploaded successfully! ✅', 'success');
          renderContent();
          setSection('resume');
        }, 1500);
      }

      upload.addEventListener('change', function (e) { handleUpload(e.target.files[0]); });

      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          IndeedAuth.updateProfile({ resumeUrl: '' });
          IndeedToast.showToast('Resume removed.', 'info');
          renderContent();
          setSection('resume');
        });
      }
    }

    function renderSavedJobs(savedJobs) {
      if (!savedJobs.length) {
        return '<h2 class="dashboard-section-title">❤️ Saved Jobs</h2><div class="no-results"><div class="no-results-icon">💔</div>' +
          '<div class="no-results-title">No saved jobs yet</div><p>Browse jobs and click the heart ❤️ icon to save them here.</p>' +
          '<button class="btn btn-primary" style="margin-top:16px;" onclick="location.href=\'jobs.html\'">Browse Jobs</button></div>';
      }
      var html = '<h2 class="dashboard-section-title">❤️ Saved Jobs</h2><div style="display:flex;flex-direction:column;gap:12px;">';
      savedJobs.forEach(function (job) {
        html += '<div class="dashboard-card" style="margin:0;"><div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
          '<div style="display:flex;gap:12px;align-items:center;"><span style="font-size:32px;">' + (job.logo || '🏢') + '</span>' +
          '<div><div style="font-weight:700;font-size:16px;color:#2557a7;">' + H.escapeHtml(job.title) + '</div>' +
          '<div style="font-size:14px;font-weight:600;">' + H.escapeHtml(job.company) + '</div>' +
          '<div style="font-size:13px;color:#767676;">📍 ' + H.escapeHtml(job.location) + ' · ' + H.formatSalaryRange(job.salary) + '</div></div></div>' +
          '<a href="job-detail.html?id=' + encodeURIComponent(job._id) + '" class="btn btn-primary btn-sm">View Job</a></div></div>';
      });
      return html + '</div>';
    }

    function renderApplicationsTable(apps) {
      if (!apps.length) {
        return '<h2 class="dashboard-section-title">📬 My Applications</h2><div class="no-results"><div class="no-results-icon">📭</div>' +
          '<div class="no-results-title">No applications yet</div><p>Apply for jobs to track your applications here.</p>' +
          '<button class="btn btn-primary" style="margin-top:16px;" onclick="location.href=\'jobs.html\'">Find Jobs to Apply</button></div>';
      }
      var html = '<h2 class="dashboard-section-title">📬 My Applications</h2><div class="table-wrapper"><table class="data-table"><thead><tr>' +
        '<th>Position</th><th>Company</th><th>Applied</th><th>Status</th><th>Action</th></tr></thead><tbody>';
      apps.forEach(function (app) {
        var statusIcon = { pending: '⏳ ', reviewed: '👀 ', accepted: '🎉 ', rejected: '❌ ' };
        html += '<tr><td><div style="font-weight:600;">' + H.escapeHtml((app.job && app.job.title) || 'N/A') + '</div>' +
          '<div style="font-size:12px;color:#767676;">' + H.escapeHtml((app.job && app.job.type) || '') + '</div></td>' +
          '<td><div>' + H.escapeHtml((app.job && app.job.company) || '') + '</div>' +
          '<div style="font-size:12px;color:#767676;">📍 ' + H.escapeHtml((app.job && app.job.location) || '') + '</div></td>' +
          '<td style="font-size:13px;color:#767676;">' + H.timeAgo(app.appliedAt) + '</td>' +
          '<td><span class="badge" style="background:' + H.getStatusColor(app.status) + '20;color:' + H.getStatusColor(app.status) + ';text-transform:capitalize;">' +
          (statusIcon[app.status] || '') + app.status + '</span></td>' +
          '<td>' + (app.job ? '<a href="job-detail.html?id=' + encodeURIComponent(app.job._id || app.jobId) + '" class="btn btn-ghost btn-sm">View Job</a>' : '') + '</td></tr>';
      });
      return html + '</tbody></table></div>';
    }

    renderContent();
  }

  function initEmployerDashboard() {
    var user = IndeedAuth.getUser();
    if (!user) { window.location.href = 'login.html'; return; }
    if (user.role !== 'employer') { window.location.href = 'dashboard.html'; return; }

    var params = H.getQueryParams();
    var activeSection = params.section || 'overview';
    var viewingJobId = null;
    var myJobs = [];
    var allApplications = {};

    function loadMyJobs() {
      var stored = JSON.parse(localStorage.getItem(EMPLOYER_JOBS_KEY) || '[]');
      myJobs = stored.filter(function (j) { return j.postedBy === user._id; });
    }

    function loadApplications() {
      var stored = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
      allApplications = {};
      var employerJobIds = myJobs.map(function (j) { return j._id; });
      stored.forEach(function (app) {
        if (employerJobIds.indexOf(app.jobId) !== -1) {
          if (!allApplications[app.jobId]) allApplications[app.jobId] = [];
          allApplications[app.jobId].push(app);
        }
      });
    }

    function totalApplications() {
      return Object.values(allApplications).reduce(function (sum, apps) { return sum + apps.length; }, 0);
    }

    function setSection(section) {
      activeSection = section;
      document.querySelectorAll('.dashboard-sidebar-link').forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('data-section') === section);
      });
      renderContent();
    }

    document.querySelectorAll('.dashboard-sidebar-link').forEach(function (link) {
      link.addEventListener('click', function () { setSection(link.getAttribute('data-section')); });
    });

    function deleteJob(jobId) {
      if (!confirm('Are you sure you want to delete this job posting?')) return;
      var stored = JSON.parse(localStorage.getItem(EMPLOYER_JOBS_KEY) || '[]');
      var updated = stored.filter(function (j) { return j._id !== jobId; });
      localStorage.setItem(EMPLOYER_JOBS_KEY, JSON.stringify(updated));
      loadMyJobs();
      IndeedToast.showToast('Job posting deleted.', 'info');
      renderContent();
    }

    function renderContent() {
      user = IndeedAuth.getUser();
      loadMyJobs();
      loadApplications();
      var content = document.getElementById('dashboard-content');
      var total = totalApplications();

      if (activeSection === 'overview') {
        var html = '<h1 style="font-size:22px;font-weight:800;margin-bottom:4px;">Employer Dashboard</h1>' +
          '<p style="color:#767676;margin-bottom:24px;">Manage your job postings and find the best talent.</p>' +
          '<div class="stats-grid">' +
          '<div class="stat-card"><div class="stat-card-number">' + myJobs.length + '</div><div class="stat-card-label">Active Listings</div></div>' +
          '<div class="stat-card"><div class="stat-card-number" style="color:#3b82f6;">' + total + '</div><div class="stat-card-label">Total Applications</div></div>' +
          '<div class="stat-card"><div class="stat-card-number" style="color:#f59e0b;">' + Object.values(allApplications).flat().filter(function (a) { return a.status === 'pending'; }).length + '</div><div class="stat-card-label">Pending Review</div></div>' +
          '<div class="stat-card"><div class="stat-card-number" style="color:#10b981;">' + Object.values(allApplications).flat().filter(function (a) { return a.status === 'accepted'; }).length + '</div><div class="stat-card-label">Accepted</div></div></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">' +
          '<div class="card" style="cursor:pointer;text-align:center;" data-goto-section="post-job"><div style="font-size:32px;margin-bottom:8px;">➕</div><div style="font-weight:700;">Post a New Job</div><div style="font-size:12px;color:#767676;">Free to post</div></div>' +
          '<div class="card" style="cursor:pointer;text-align:center;" data-goto-section="applications"><div style="font-size:32px;margin-bottom:8px;">📬</div><div style="font-weight:700;">View Applications</div><div style="font-size:12px;color:#2557a7;font-weight:600;">' + total + ' received</div></div></div>';
        if (myJobs.length) {
          html += '<div class="dashboard-card"><h2 class="dashboard-section-title">Recent Job Postings</h2>';
          myJobs.slice(0, 3).forEach(function (job) {
            html += '<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><div><div style="font-weight:600;">' + H.escapeHtml(job.title) + '</div>' +
              '<div style="font-size:12px;color:#767676;">' + H.escapeHtml(job.type) + ' · ' + H.escapeHtml(job.location) + ' · ' + H.timeAgo(job.createdAt) + '</div></div><span class="badge badge-success">Active</span></div>';
          });
          html += '<button class="btn btn-outline btn-sm" style="margin-top:12px;" data-goto-section="jobs">View All Postings →</button></div>';
        }
        content.innerHTML = html;
        content.querySelectorAll('[data-goto-section]').forEach(function (el) {
          el.addEventListener('click', function () { setSection(el.getAttribute('data-goto-section')); });
        });
      } else if (activeSection === 'post-job') {
        content.innerHTML = renderPostJobForm(user);
        bindPostJobForm(user);
      } else if (activeSection === 'jobs') {
        content.innerHTML = renderMyJobsTable(myJobs);
        bindJobsTable();
      } else if (activeSection === 'applications') {
        content.innerHTML = renderEmployerApplications(myJobs, allApplications, viewingJobId);
        bindEmployerApplications();
      } else if (activeSection === 'company') {
        content.innerHTML = renderCompanyProfile(user);
        bindCompanyProfile(user);
      }
    }

    function renderPostJobForm(user) {
      return (
        '<h2 class="dashboard-section-title">➕ Post a New Job</h2><div class="dashboard-card"><form id="post-job-form">' +
        '<div class="form-group"><label class="form-label">Job Title *</label><input class="form-input" id="job-title" placeholder="e.g. Senior React Developer"><span class="form-error" id="err-title"></span></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;"><div class="form-group"><label class="form-label">Location *</label><input class="form-input" id="job-location" placeholder="e.g. Lahore, Karachi, Remote"><span class="form-error" id="err-location"></span></div>' +
        '<div class="form-group"><label class="form-label">Job Type *</label><select class="form-select" id="job-type">' +
        ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'].map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;"><div class="form-group"><label class="form-label">Min Salary (PKR) *</label><input type="number" class="form-input" id="job-salary-min" placeholder="e.g. 80000" min="0"><span class="form-error" id="err-salaryMin"></span></div>' +
        '<div class="form-group"><label class="form-label">Max Salary (PKR) *</label><input type="number" class="form-input" id="job-salary-max" placeholder="e.g. 150000" min="0"><span class="form-error" id="err-salaryMax"></span></div>' +
        '<div class="form-group"><label class="form-label">Application Deadline *</label><input type="date" class="form-input" id="job-deadline" min="' + new Date().toISOString().split('T')[0] + '"><span class="form-error" id="err-deadline"></span></div></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;"><div class="form-group"><label class="form-label">Experience Required</label><select class="form-select" id="job-experience"><option value="">Not specified</option>' +
        ['0-1 year', '1-3 years', '2-4 years', '3-5 years', '5+ years', '7+ years'].map(function (e) { return '<option>' + e + '</option>'; }).join('') + '</select></div>' +
        '<div class="form-group"><label class="form-label">Category</label><select class="form-select" id="job-category">' +
        ['Technology', 'Marketing', 'Finance', 'Design', 'Human Resources', 'Operations', 'Sales', 'Content', 'Data Science', 'Product', 'Other'].map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="form-group"><label style="display:flex;align-items:center;gap:10px;cursor:pointer;"><input type="checkbox" id="job-remote" style="accent-color:#2557a7;width:18px;height:18px;"><span class="form-label" style="margin:0;">🏠 This is a remote-friendly position</span></label></div>' +
        '<div class="form-group"><label class="form-label">Required Skills *</label><div style="display:flex;gap:8px;margin-bottom:10px;"><input class="form-input" id="job-skill-input" placeholder="e.g. React, Node.js, SQL..."><button type="button" class="btn btn-outline" id="job-add-skill">Add</button></div>' +
        '<span class="form-error" id="err-skills"></span><div id="job-skills-list" style="display:flex;flex-wrap:wrap;gap:8px;"></div></div>' +
        '<div class="form-group"><label class="form-label">Job Description * (min 100 chars, markdown supported)</label>' +
        '<textarea class="form-textarea" id="job-description" style="min-height:200px;" placeholder="## About the Role&#10;Describe what this role involves..."></textarea>' +
        '<div style="display:flex;justify-content:space-between;font-size:12px;color:#767676;"><span id="err-description"></span><span id="desc-count">0</span> chars</div></div>' +
        '<button type="submit" class="btn btn-primary btn-lg" id="publish-job" style="width:100%;">🚀 Publish Job Listing</button></form></div>'
      );
    }

    function bindPostJobForm(user) {
      var skills = [];
      var desc = document.getElementById('job-description');
      var descCount = document.getElementById('desc-count');

      desc.addEventListener('input', function () { descCount.textContent = desc.value.length; });

      function renderSkills() {
        document.getElementById('job-skills-list').innerHTML = skills.map(function (s) {
          return '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#e8f0fe;color:#2557a7;border-radius:20px;font-size:13px;">' +
            H.escapeHtml(s) + ' <button type="button" data-rm="' + H.escapeHtml(s) + '" style="background:none;border:none;cursor:pointer;color:#2557a7;font-weight:700;">×</button></span>';
        }).join('');
        document.querySelectorAll('#job-skills-list [data-rm]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            skills = skills.filter(function (s) { return s !== btn.getAttribute('data-rm'); });
            renderSkills();
          });
        });
      }

      document.getElementById('job-add-skill').addEventListener('click', function () {
        var val = document.getElementById('job-skill-input').value.trim();
        if (val && skills.indexOf(val) === -1) { skills.push(val); document.getElementById('job-skill-input').value = ''; renderSkills(); }
      });

      document.getElementById('post-job-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var errors = {};
        var title = document.getElementById('job-title').value.trim();
        var location = document.getElementById('job-location').value.trim();
        var salaryMin = document.getElementById('job-salary-min').value;
        var salaryMax = document.getElementById('job-salary-max').value;
        var deadline = document.getElementById('job-deadline').value;
        var description = desc.value.trim();

        document.querySelectorAll('[id^="err-"]').forEach(function (el) { el.textContent = ''; });

        if (!title) errors.title = 'Job title is required.';
        if (!description || description.length < 100) errors.description = 'Description must be at least 100 characters.';
        if (!location) errors.location = 'Location is required.';
        if (!salaryMin) errors.salaryMin = 'Minimum salary is required.';
        if (!salaryMax) errors.salaryMax = 'Maximum salary is required.';
        if (parseInt(salaryMax, 10) < parseInt(salaryMin, 10)) errors.salaryMax = 'Max salary must be >= min salary.';
        if (!deadline) errors.deadline = 'Application deadline is required.';
        if (!skills.length) errors.skills = 'Add at least one required skill.';

        Object.keys(errors).forEach(function (key) {
          var el = document.getElementById('err-' + key);
          if (el) el.textContent = '⚠️ ' + errors[key];
        });
        if (Object.keys(errors).length) return;

        var btn = document.getElementById('publish-job');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Publishing Job...';

        setTimeout(function () {
          var newJob = {
            _id: 'job_emp_' + Date.now(),
            title: title,
            description: description,
            company: user.company || user.name,
            location: location,
            salary: { min: parseInt(salaryMin, 10), max: parseInt(salaryMax, 10), currency: 'PKR' },
            type: document.getElementById('job-type').value,
            skills: skills,
            postedBy: user._id,
            deadline: deadline,
            createdAt: new Date().toISOString(),
            logo: '🏢',
            remote: document.getElementById('job-remote').checked,
            experience: document.getElementById('job-experience').value,
            category: document.getElementById('job-category').value,
          };
          var stored = JSON.parse(localStorage.getItem(EMPLOYER_JOBS_KEY) || '[]');
          stored.push(newJob);
          localStorage.setItem(EMPLOYER_JOBS_KEY, JSON.stringify(stored));
          IndeedToast.showToast('Job posted successfully! 🎉', 'success');
          setSection('jobs');
        }, 1000);
      });
    }

    function renderMyJobsTable(jobs) {
      if (!jobs.length) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><h2 class="dashboard-section-title">💼 My Posted Jobs</h2>' +
          '<button class="btn btn-primary btn-sm" data-goto-section="post-job">➕ Post New Job</button></div>' +
          '<div class="no-results"><div class="no-results-icon">📋</div><div class="no-results-title">No jobs posted yet</div>' +
          '<p>Post your first job to start receiving applications.</p><button class="btn btn-primary" style="margin-top:16px;" data-goto-section="post-job">Post Your First Job</button></div>';
      }
      var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><h2 class="dashboard-section-title">💼 My Posted Jobs</h2>' +
        '<button class="btn btn-primary btn-sm" data-goto-section="post-job">➕ Post New Job</button></div><div class="table-wrapper"><table class="data-table"><thead><tr>' +
        '<th>Job Title</th><th>Location</th><th>Type</th><th>Posted</th><th>Applications</th><th>Actions</th></tr></thead><tbody>';
      jobs.forEach(function (job) {
        html += '<tr><td><div style="font-weight:600;">' + H.escapeHtml(job.title) + '</div><div style="font-size:12px;color:#767676;">' + H.formatSalaryRange(job.salary) + '</div></td>' +
          '<td>' + H.escapeHtml(job.location) + '</td><td><span class="badge badge-primary">' + H.escapeHtml(job.type) + '</span></td>' +
          '<td style="font-size:13px;color:#767676;">' + H.timeAgo(job.createdAt) + '</td>' +
          '<td><button class="btn btn-ghost btn-sm view-apps-btn" data-job-id="' + job._id + '" style="color:#2557a7;">' + ((allApplications[job._id] || []).length) + ' apps</button></td>' +
          '<td><div style="display:flex;gap:6px;"><a href="job-detail.html?id=' + encodeURIComponent(job._id) + '" class="btn btn-ghost btn-sm">View</a>' +
          '<button class="btn btn-danger btn-sm delete-job-btn" data-job-id="' + job._id + '">Delete</button></div></td></tr>';
      });
      return html + '</tbody></table></div>';
    }

    function bindJobsTable() {
      document.querySelectorAll('[data-goto-section]').forEach(function (el) {
        el.addEventListener('click', function () { setSection(el.getAttribute('data-goto-section')); });
      });
      document.querySelectorAll('.delete-job-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { deleteJob(btn.getAttribute('data-job-id')); });
      });
      document.querySelectorAll('.view-apps-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          viewingJobId = btn.getAttribute('data-job-id');
          setSection('applications');
        });
      });
    }

    function renderEmployerApplications(jobs, apps, viewId) {
      if (!jobs.length) {
        return '<h2 class="dashboard-section-title">📬 Applications Received</h2><div class="no-results"><div class="no-results-icon">📭</div><div class="no-results-title">No jobs posted</div><p>Post a job first to receive applications.</p></div>';
      }
      var total = totalApplications();
      var appsToShow = viewId ? (apps[viewId] || []) : Object.values(apps).flat();

      var html = '<h2 class="dashboard-section-title">📬 Applications Received</h2>' +
        '<div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">' +
        '<button class="btn btn-sm ' + (viewId === null ? 'btn-primary' : 'btn-ghost') + '" id="apps-all">All Jobs (' + total + ')</button>';
      jobs.forEach(function (job) {
        html += '<button class="btn btn-sm app-filter-btn ' + (viewId === job._id ? 'btn-primary' : 'btn-ghost') + '" data-job-id="' + job._id + '">' + H.escapeHtml(job.title.slice(0, 20)) + '... (' + ((apps[job._id] || []).length) + ')</button>';
      });
      html += '</div>';

      if (!appsToShow.length) {
        return html + '<div class="no-results"><div class="no-results-icon">📭</div><div class="no-results-title">No applications yet</div><p>Share your job listing to attract more candidates.</p></div>';
      }

      html += '<div class="table-wrapper"><table class="data-table"><thead><tr><th>Applicant</th><th>Position</th><th>Applied</th><th>Resume</th><th>Status</th><th>Action</th></tr></thead><tbody>';
      appsToShow.forEach(function (a) {
        html += '<tr><td><div style="display:flex;align-items:center;gap:8px;"><div class="avatar" style="width:32px;height:32px;font-size:14px;">' +
          ((a.applicant && a.applicant.name) ? a.applicant.name.charAt(0) : '?') + '</div><div><div style="font-weight:600;font-size:13px;">' +
          H.escapeHtml((a.applicant && a.applicant.name) || '') + '</div><div style="font-size:11px;color:#767676;">' + H.escapeHtml((a.applicant && a.applicant.email) || '') + '</div></div></div></td>' +
          '<td style="font-size:13px;">' + H.escapeHtml((a.job && a.job.title) || '') + '</td>' +
          '<td style="font-size:12px;color:#767676;">' + H.timeAgo(a.appliedAt) + '</td>' +
          '<td><button class="btn btn-outline btn-sm download-resume" data-resume="' + H.escapeHtml(a.resumeUrl || '') + '">📄 ' + H.escapeHtml((a.resumeUrl || '').slice(0, 15)) + '...</button></td>' +
          '<td><select class="form-select status-select" data-app-id="' + a._id + '" style="padding:4px 8px;font-size:12px;width:auto;">' +
          '<option value="pending"' + (a.status === 'pending' ? ' selected' : '') + '>⏳ Pending</option>' +
          '<option value="reviewed"' + (a.status === 'reviewed' ? ' selected' : '') + '>👀 Reviewed</option>' +
          '<option value="accepted"' + (a.status === 'accepted' ? ' selected' : '') + '>🎉 Accepted</option>' +
          '<option value="rejected"' + (a.status === 'rejected' ? ' selected' : '') + '>❌ Rejected</option></select></td>' +
          '<td><button class="btn btn-ghost btn-sm email-applicant">📧 Email</button></td></tr>';
      });
      return html + '</tbody></table></div>';
    }

    function bindEmployerApplications() {
      var allBtn = document.getElementById('apps-all');
      if (allBtn) allBtn.addEventListener('click', function () { viewingJobId = null; renderContent(); });
      document.querySelectorAll('.app-filter-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          viewingJobId = btn.getAttribute('data-job-id');
          renderContent();
        });
      });
      document.querySelectorAll('.status-select').forEach(function (select) {
        select.addEventListener('change', function () {
          var stored = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
          var idx = stored.findIndex(function (s) { return s._id === select.getAttribute('data-app-id'); });
          if (idx !== -1) {
            stored[idx].status = select.value;
            localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(stored));
            IndeedToast.showToast('Application status updated to ' + select.value + '.', 'success');
            renderContent();
          }
        });
      });
      document.querySelectorAll('.download-resume').forEach(function (btn) {
        btn.addEventListener('click', function () {
          IndeedToast.showToast('Downloading ' + btn.getAttribute('data-resume') + '...', 'info');
        });
      });
      document.querySelectorAll('.email-applicant').forEach(function (btn) {
        btn.addEventListener('click', function () {
          IndeedToast.showToast('Email sent to applicant!', 'success');
        });
      });
    }

    function renderCompanyProfile(user) {
      return (
        '<h2 class="dashboard-section-title">🏢 Company Profile</h2><div class="dashboard-card"><form id="company-form">' +
        '<div class="form-group"><label class="form-label">Company Name</label><input class="form-input" id="company-name" value="' + H.escapeHtml(user.company || '') + '"></div>' +
        '<div class="form-group"><label class="form-label">About the Company</label><textarea class="form-textarea" id="company-bio" maxlength="500">' + H.escapeHtml(user.bio || '') + '</textarea>' +
        '<div style="font-size:12px;color:#767676;text-align:right;"><span id="company-bio-count">' + (user.bio || '').length + '</span>/500</div></div>' +
        '<button type="submit" class="btn btn-primary" id="company-save">💾 Save Company Profile</button></form></div>'
      );
    }

    function bindCompanyProfile(user) {
      var bio = document.getElementById('company-bio');
      document.getElementById('company-bio-count').textContent = bio.value.length;
      bio.addEventListener('input', function () {
        document.getElementById('company-bio-count').textContent = bio.value.length;
      });
      document.getElementById('company-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var btn = document.getElementById('company-save');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Saving...';
        setTimeout(function () {
          IndeedAuth.updateProfile({
            company: document.getElementById('company-name').value.trim(),
            bio: bio.value.trim(),
          });
          IndeedToast.showToast('Company profile updated! ✅', 'success');
          btn.disabled = false;
          btn.textContent = '💾 Save Company Profile';
        }, 800);
      });
    }

    setSection(activeSection);
  }

  global.IndeedDashboard = {
    initSeekerDashboard: initSeekerDashboard,
    initEmployerDashboard: initEmployerDashboard,
  };
})(window);
