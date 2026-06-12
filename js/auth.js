/* Authentication module — localStorage-based auth */
(function (global) {
  'use strict';

  var USERS_STORAGE_KEY = 'indeed_clone_users';
  var AUTH_STORAGE_KEY = 'indeed_clone_auth';

  var user = null;
  var token = null;
  var isLoading = true;
  var listeners = [];

  function notify() {
    listeners.forEach(function (fn) {
      fn();
    });
  }

  function subscribe(fn) {
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (l) {
        return l !== fn;
      });
    };
  }

  function getStoredUsers() {
    try {
      var stored = localStorage.getItem(USERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveStoredUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  function persistAuth(newUser, newToken) {
    user = newUser;
    token = newToken;
    if (user && token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: user, token: token }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    notify();
  }

  function restoreSession() {
    try {
      var stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        var parsed = JSON.parse(stored);
        user = parsed.user;
        token = parsed.token;
      }
    } catch (e) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    isLoading = false;
    notify();
  }

  function login(email, password) {
    isLoading = true;
    notify();
    return new Promise(function (resolve) {
      setTimeout(function () {
        var users = getStoredUsers();
        var foundUser = users.find(function (u) {
          return u.email.toLowerCase() === email.toLowerCase();
        });

        if (!foundUser) {
          isLoading = false;
          notify();
          resolve({ success: false, error: 'No account found with this email.' });
          return;
        }

        var storedPasswords = JSON.parse(localStorage.getItem('indeed_passwords') || '{}');
        if (storedPasswords[foundUser._id] !== password) {
          isLoading = false;
          notify();
          resolve({ success: false, error: 'Incorrect password.' });
          return;
        }

        var fakeToken = btoa(JSON.stringify({ id: foundUser._id, exp: Date.now() + 86400000 }));
        var latestUser = users.find(function (u) {
          return u._id === foundUser._id;
        }) || foundUser;
        persistAuth(latestUser, fakeToken);
        isLoading = false;
        notify();
        resolve({ success: true });
      }, 600);
    });
  }

  function signup(data) {
    isLoading = true;
    notify();
    return new Promise(function (resolve) {
      setTimeout(function () {
        var users = getStoredUsers();

        if (users.find(function (u) {
          return u.email.toLowerCase() === data.email.toLowerCase();
        })) {
          isLoading = false;
          notify();
          resolve({ success: false, error: 'An account with this email already exists.' });
          return;
        }

        var newUser = {
          _id: 'user_' + Date.now(),
          name: data.name,
          email: data.email,
          role: data.role,
          phone: '',
          bio: '',
          skills: [],
          resumeUrl: '',
          savedJobs: [],
          company: data.company || '',
          createdAt: new Date().toISOString(),
        };

        var passwords = JSON.parse(localStorage.getItem('indeed_passwords') || '{}');
        passwords[newUser._id] = data.password;
        localStorage.setItem('indeed_passwords', JSON.stringify(passwords));

        users.push(newUser);
        saveStoredUsers(users);

        var fakeToken = btoa(JSON.stringify({ id: newUser._id, exp: Date.now() + 86400000 }));
        persistAuth(newUser, fakeToken);
        isLoading = false;
        notify();
        resolve({ success: true });
      }, 600);
    });
  }

  function logout() {
    persistAuth(null, null);
  }

  function updateProfile(updates) {
    if (!user) return;
    var updatedUser = Object.assign({}, user, updates);
    user = updatedUser;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: updatedUser, token: token }));
    var users = getStoredUsers();
    var idx = users.findIndex(function (u) {
      return u._id === user._id;
    });
    if (idx !== -1) {
      users[idx] = updatedUser;
      saveStoredUsers(users);
    }
    notify();
  }

  function saveJob(jobId) {
    if (!user) return;
    var updatedSaved = Array.from(new Set(user.savedJobs.concat([jobId])));
    updateProfile({ savedJobs: updatedSaved });
  }

  function unsaveJob(jobId) {
    if (!user) return;
    var updatedSaved = user.savedJobs.filter(function (id) {
      return id !== jobId;
    });
    updateProfile({ savedJobs: updatedSaved });
  }

  function getUser() {
    return user;
  }

  function getToken() {
    return token;
  }

  function getIsLoading() {
    return isLoading;
  }

  function initLoginPage() {
    var form = document.getElementById('login-form');
    if (!form) return;

    var emailInput = document.getElementById('login-email');
    var passwordInput = document.getElementById('login-password');
    var roleSeekerBtn = document.getElementById('role-seeker');
    var roleEmployerBtn = document.getElementById('role-employer');
    var showPasswordBtn = document.getElementById('toggle-password');
    var demoSeekerBtn = document.getElementById('demo-seeker');
    var demoEmployerBtn = document.getElementById('demo-employer');
    var generalError = document.getElementById('login-general-error');
    var submitBtn = document.getElementById('login-submit');

    var role = 'seeker';
    var showPassword = false;

    function setRole(r) {
      role = r;
      roleSeekerBtn.classList.toggle('active', r === 'seeker');
      roleEmployerBtn.classList.toggle('active', r === 'employer');
      roleSeekerBtn.setAttribute('aria-selected', r === 'seeker');
      roleEmployerBtn.setAttribute('aria-selected', r === 'employer');
      document.getElementById('login-role-desc').textContent =
        r === 'seeker'
          ? 'Access your saved jobs, applications, and more.'
          : 'Manage your job postings and find great talent.';
    }

    roleSeekerBtn.addEventListener('click', function () { setRole('seeker'); });
    roleEmployerBtn.addEventListener('click', function () { setRole('employer'); });

    showPasswordBtn.addEventListener('click', function () {
      showPassword = !showPassword;
      passwordInput.type = showPassword ? 'text' : 'password';
      showPasswordBtn.textContent = showPassword ? '🙈' : '👁️';
      showPasswordBtn.setAttribute('aria-label', showPassword ? 'Hide password' : 'Show password');
    });

    document.getElementById('forgot-password').addEventListener('click', function () {
      IndeedToast.showToast('Password reset feature coming soon!', 'info');
    });

    demoSeekerBtn.addEventListener('click', function () {
      setRole('seeker');
      emailInput.value = 'demo.seeker@example.com';
      passwordInput.value = 'Demo1234';
      IndeedToast.showToast('Demo credentials filled! Click Sign In.', 'info');
    });

    demoEmployerBtn.addEventListener('click', function () {
      setRole('employer');
      emailInput.value = 'demo.employer@example.com';
      passwordInput.value = 'Demo1234';
      IndeedToast.showToast('Demo credentials filled! Click Sign In.', 'info');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errors = {};
      var email = emailInput.value.trim();
      var password = passwordInput.value;

      document.getElementById('email-error').textContent = '';
      document.getElementById('password-error').textContent = '';
      generalError.style.display = 'none';
      emailInput.classList.remove('error');
      passwordInput.classList.remove('error');

      if (!email) {
        errors.email = 'Email address is required.';
      } else if (!IndeedHelpers.isValidEmail(email)) {
        errors.email = 'Please enter a valid email address.';
      }
      if (!password) {
        errors.password = 'Password is required.';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters.';
      }

      if (errors.email) {
        document.getElementById('email-error').textContent = '⚠️ ' + errors.email;
        emailInput.classList.add('error');
      }
      if (errors.password) {
        document.getElementById('password-error').textContent = '⚠️ ' + errors.password;
        passwordInput.classList.add('error');
      }
      if (Object.keys(errors).length) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span style="display:flex;align-items:center;gap:8px;justify-content:center;"><span class="spinner"></span>Signing in...</span>';

      login(email, password).then(function (result) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
        if (result.success) {
          IndeedToast.showToast('Welcome back! 👋', 'success');
          window.location.href = 'index.html';
        } else {
          generalError.textContent = '❌ ' + result.error;
          generalError.style.display = 'flex';
        }
      });
    });
  }

  function initSignupPage() {
    var form = document.getElementById('signup-form');
    if (!form) return;

    var nameInput = document.getElementById('signup-name');
    var emailInput = document.getElementById('signup-email');
    var passwordInput = document.getElementById('signup-password');
    var confirmInput = document.getElementById('signup-confirm');
    var companyInput = document.getElementById('signup-company');
    var companyGroup = document.getElementById('company-group');
    var roleSeekerBtn = document.getElementById('role-seeker');
    var roleEmployerBtn = document.getElementById('role-employer');
    var showPasswordBtn = document.getElementById('toggle-password');
    var generalError = document.getElementById('signup-general-error');
    var submitBtn = document.getElementById('signup-submit');

    var role = 'seeker';
    var showPassword = false;

    function setRole(r) {
      role = r;
      roleSeekerBtn.classList.toggle('active', r === 'seeker');
      roleEmployerBtn.classList.toggle('active', r === 'employer');
      roleSeekerBtn.setAttribute('aria-selected', r === 'seeker');
      roleEmployerBtn.setAttribute('aria-selected', r === 'employer');
      companyGroup.style.display = r === 'employer' ? 'block' : 'none';
      document.getElementById('signup-role-desc').textContent =
        r === 'seeker'
          ? 'Create an account to apply for jobs and track applications.'
          : 'Create an employer account to post jobs and find talent.';
    }

    roleSeekerBtn.addEventListener('click', function () { setRole('seeker'); });
    roleEmployerBtn.addEventListener('click', function () { setRole('employer'); });

    showPasswordBtn.addEventListener('click', function () {
      showPassword = !showPassword;
      passwordInput.type = showPassword ? 'text' : 'password';
      confirmInput.type = showPassword ? 'text' : 'password';
      showPasswordBtn.textContent = showPassword ? '🙈' : '👁️';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameInput.value.trim();
      var email = emailInput.value.trim();
      var password = passwordInput.value;
      var confirm = confirmInput.value;
      var company = companyInput.value.trim();

      document.querySelectorAll('.signup-field-error').forEach(function (el) {
        el.textContent = '';
      });
      form.querySelectorAll('.form-input').forEach(function (el) {
        el.classList.remove('error');
      });
      generalError.style.display = 'none';

      var hasError = false;

      if (!name) {
        document.getElementById('name-error').textContent = '⚠️ Full name is required.';
        nameInput.classList.add('error');
        hasError = true;
      }
      if (!email) {
        document.getElementById('signup-email-error').textContent = '⚠️ Email is required.';
        emailInput.classList.add('error');
        hasError = true;
      } else if (!IndeedHelpers.isValidEmail(email)) {
        document.getElementById('signup-email-error').textContent = '⚠️ Please enter a valid email.';
        emailInput.classList.add('error');
        hasError = true;
      }
      if (!password) {
        document.getElementById('password-error').textContent = '⚠️ Password is required.';
        passwordInput.classList.add('error');
        hasError = true;
      } else if (!IndeedHelpers.isValidPassword(password)) {
        document.getElementById('password-error').textContent = '⚠️ Password must be 8+ chars with 1 uppercase and 1 number.';
        passwordInput.classList.add('error');
        hasError = true;
      }
      if (password !== confirm) {
        document.getElementById('confirm-error').textContent = '⚠️ Passwords do not match.';
        confirmInput.classList.add('error');
        hasError = true;
      }
      if (role === 'employer' && !company) {
        document.getElementById('company-error').textContent = '⚠️ Company name is required for employers.';
        companyInput.classList.add('error');
        hasError = true;
      }
      if (hasError) return;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span style="display:flex;align-items:center;gap:8px;justify-content:center;"><span class="spinner"></span>Creating account...</span>';

      signup({
        name: name,
        email: email,
        password: password,
        role: role,
        company: role === 'employer' ? company : '',
      }).then(function (result) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        if (result.success) {
          IndeedToast.showToast('Account created successfully! 🎉', 'success');
          window.location.href = 'index.html';
        } else {
          generalError.textContent = '❌ ' + result.error;
          generalError.style.display = 'flex';
        }
      });
    });
  }

  global.IndeedAuth = {
    restoreSession: restoreSession,
    subscribe: subscribe,
    login: login,
    signup: signup,
    logout: logout,
    updateProfile: updateProfile,
    saveJob: saveJob,
    unsaveJob: unsaveJob,
    getUser: getUser,
    getToken: getToken,
    getIsLoading: getIsLoading,
    initLoginPage: initLoginPage,
    initSignupPage: initSignupPage,
  };
})(window);
