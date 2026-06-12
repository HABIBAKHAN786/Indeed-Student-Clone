/* Demo account seeder — runs once on app load */
(function (global) {
  'use strict';

  var USERS_STORAGE_KEY = 'indeed_clone_users';
  var PASSWORDS_KEY = 'indeed_passwords';
  var SEEDED_FLAG = 'indeed_clone_seeded_v2';

  function seedDemoAccounts() {
    if (localStorage.getItem(SEEDED_FLAG)) return;

    var demoSeeker = {
      _id: 'demo_seeker_001',
      name: 'Ahmed Khan',
      email: 'demo.seeker@example.com',
      role: 'seeker',
      phone: '+92 300 1234567',
      bio: 'Experienced software developer with 3+ years of experience in React and Node.js. Passionate about building user-friendly web applications.',
      skills: ['React.js', 'Node.js', 'MongoDB', 'TypeScript', 'CSS3'],
      resumeUrl: 'ahmed_khan_resume.pdf',
      savedJobs: ['job_001', 'job_005', 'job_014'],
      company: '',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    var demoEmployer = {
      _id: 'demo_employer_001',
      name: 'Fatima Zahra',
      email: 'demo.employer@example.com',
      role: 'employer',
      phone: '+92 321 9876543',
      bio: 'HR Manager at Systems Limited, responsible for talent acquisition and employer branding.',
      skills: [],
      resumeUrl: '',
      savedJobs: [],
      company: 'Systems Limited',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    };

    var existingUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    var withoutDemos = existingUsers.filter(function (u) {
      return ['demo_seeker_001', 'demo_employer_001'].indexOf(u._id) === -1;
    });
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(withoutDemos.concat([demoSeeker, demoEmployer])));

    var passwords = JSON.parse(localStorage.getItem(PASSWORDS_KEY) || '{}');
    passwords['demo_seeker_001'] = 'Demo1234';
    passwords['demo_employer_001'] = 'Demo1234';
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));

    var demoApplications = [
      {
        _id: 'app_demo_001',
        jobId: 'job_001',
        job: {
          _id: 'job_001',
          title: 'Senior React Developer',
          company: 'Systems Limited',
          location: 'Lahore',
          type: 'Full-time',
        },
        applicantId: 'demo_seeker_001',
        applicant: demoSeeker,
        coverLetter: 'I am very excited to apply for this React Developer position at Systems Limited...',
        resumeUrl: 'ahmed_khan_resume.pdf',
        status: 'reviewed',
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'app_demo_002',
        jobId: 'job_014',
        job: {
          _id: 'job_014',
          title: 'Node.js Backend Developer (Remote)',
          company: 'Fixpert',
          location: 'Remote',
          type: 'Full-time',
        },
        applicantId: 'demo_seeker_001',
        applicant: demoSeeker,
        coverLetter: 'I have extensive experience with Node.js and Express, and I would love to join Fixpert...',
        resumeUrl: 'ahmed_khan_resume.pdf',
        status: 'pending',
        appliedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: 'app_demo_003',
        jobId: 'job_006',
        job: {
          _id: 'job_006',
          title: 'Python / Django Developer',
          company: 'Arbisoft',
          location: 'Lahore',
          type: 'Full-time',
        },
        applicantId: 'demo_seeker_001',
        applicant: demoSeeker,
        coverLetter: 'I am interested in the Python Developer role at Arbisoft...',
        resumeUrl: 'ahmed_khan_resume.pdf',
        status: 'accepted',
        appliedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    var existingApps = JSON.parse(localStorage.getItem('indeed_applications') || '[]');
    var withoutDemoApps = existingApps.filter(function (a) {
      return !a._id.startsWith('app_demo_');
    });
    localStorage.setItem('indeed_applications', JSON.stringify(withoutDemoApps.concat(demoApplications)));

    localStorage.setItem(SEEDED_FLAG, 'true');

    console.log('✅ Demo accounts seeded:');
    console.log('   Seeker:   demo.seeker@example.com   / Demo1234');
    console.log('   Employer: demo.employer@example.com / Demo1234');
  }

  global.IndeedSeed = { seedDemoAccounts: seedDemoAccounts };
})(window);
