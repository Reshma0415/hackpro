import React, { useState, useRef, useEffect } from 'react';
import { 
  Briefcase, 
  GraduationCap, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Phone, 
  User, 
  Upload,
  KeyRound, 
  RefreshCw, 
  Sparkles, 
  ArrowRight, 
  X, 
  FileCheck,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../../api/client';

export const ApplicationForm = ({ initialData, onComplete, onCancel }) => {
  const resumeInputRef = useRef(null);

  // Basic Details
  const [jobRole, setJobRole] = useState(initialData.jobRole || 'Senior Full Stack Engineer');
  const [firstName, setFirstName] = useState(initialData.firstName || '');
  const [lastName, setLastName] = useState(initialData.lastName || '');
  const [phone, setPhone] = useState(initialData.phone || '');
  const [email, setEmail] = useState(initialData.email || '');

  // Account Password (For Candidate Login)
  const [password, setPassword] = useState(initialData.password || '');
  const [confirmPassword, setConfirmPassword] = useState(initialData.confirmPassword || '');
  const [showPassword, setShowPassword] = useState(false);

  // Contact Verification States (Real Nodemailer SMTP Email OTP + Real Mobile SMS OTP)
  const [phoneOtpSent, setPhoneOtpSent] = useState(initialData.phoneVerified || false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(initialData.phoneVerified || false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);

  const [emailOtpSent, setEmailOtpSent] = useState(initialData.emailVerified || false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(initialData.emailVerified || false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  // 60s Countdown timers for OTP resend cooldown
  useEffect(() => {
    let timer;
    if (phoneCooldown > 0) {
      timer = setInterval(() => {
        setPhoneCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phoneCooldown]);

  useEffect(() => {
    let timer;
    if (emailCooldown > 0) {
      timer = setInterval(() => {
        setEmailCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [emailCooldown]);

  // Education Details
  const [tenth, setTenth] = useState(initialData.education?.tenth || {
    school: '',
    board: 'CBSE',
    year: '2018',
    percentage: '',
    marksheet: ''
  });

  const [twelfth, setTwelfth] = useState(initialData.education?.twelfth || {
    school: '',
    board: 'CBSE',
    year: '2020',
    percentage: '',
    marksheet: ''
  });

  const [college, setCollege] = useState(initialData.education?.college || {
    collegeName: '',
    degree: 'B.Tech in Computer Science',
    branch: 'Computer Science & Engineering',
    university: '',
    cgpa: '',
    graduationYear: '2024',
    marksheet: ''
  });

  // Work Experience
  const [hasWorkExperience, setHasWorkExperience] = useState(initialData.hasWorkExperience || false);
  const [experiences, setExperiences] = useState(
    initialData.experience?.length > 0 ? initialData.experience : [{
      companyName: '',
      jobRole: '',
      yearsOfExperience: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      employmentType: 'Full Time',
      managerName: '',
      managerContact: '',
      responsibilities: '',
      technologies: '',
      experienceCertificate: ''
    }]
  );

  // Internship
  const [hasInternship, setHasInternship] = useState(initialData.hasInternship || false);
  const [internships, setInternships] = useState(
    initialData.internships?.length > 0 ? initialData.internships : [{
      companyName: '',
      internshipRole: '',
      startDate: '',
      endDate: '',
      paid: 'Paid', // 'Paid' | 'Unpaid'
      workMode: 'Hybrid',
      managerMentor: '',
      contactDetails: '',
      technologies: '',
      responsibilities: '',
      internshipCertificate: ''
    }]
  );

  // Skills & Resume
  const [skills, setSkills] = useState(
    initialData.skills?.length > 0 ? initialData.skills : [
      { name: 'React.js', level: 'Advanced' },
      { name: 'Node.js', level: 'Intermediate' },
      { name: 'TypeScript', level: 'Intermediate' }
    ]
  );
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('Intermediate');

  // Resume File & Metadata State
  const [resumeFileObj, setResumeFileObj] = useState(null);
  const [resume, setResume] = useState(initialData.resume || null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeSuccessMsg, setResumeSuccessMsg] = useState(
    initialData.resume?.fileName ? 'Resume uploaded successfully.' : ''
  );
  const [resumeError, setResumeError] = useState('');

  // Validation Error State
  const [validationError, setValidationError] = useState('');

  // Phone OTP Handlers (Generated ONLY after clicking "Send OTP")
  const handleSendPhoneOtp = async () => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setValidationError('Please enter a valid 10-digit phone number');
      return;
    }
    setValidationError('');
    setSendingPhoneOtp(true);

    try {
      const res = await api.post('/applications/send-phone-otp', { phone: cleanPhone });
      if (res.data.success) {
        setPhoneOtpSent(true);
        setPhoneOtp('');
        setPhoneCooldown(res.data.cooldownSeconds || 60);
      }
    } catch (err) {
      setValidationError(err.response?.data?.message || 'Unable to send SMS OTP. Please check the phone number and try again.');
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (!phoneOtp || phoneOtp.trim().length !== 6) {
      setValidationError('Please enter the 6-digit OTP code received on your phone');
      return;
    }
    setValidationError('');
    setVerifyingPhoneOtp(true);
    try {
      const res = await api.post('/applications/verify-phone-otp', { phone: cleanPhone, otp: phoneOtp.trim() });
      if (res.data.success) {
        setPhoneVerified(true);
        setPhoneOtp('');
      }
    } catch (err) {
      setValidationError(err.response?.data?.message || 'Invalid or expired phone OTP code. Please try again.');
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  // Email OTP Handlers (Nodemailer SMTP Real Delivery)
  const handleSendEmailOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError('Please enter a valid email address');
      return;
    }
    setValidationError('');
    setSendingEmailOtp(true);

    try {
      const res = await api.post('/applications/send-email-otp', { email: email.trim() });
      if (res.data.success) {
        setEmailOtpSent(true);
        setEmailOtp('');
        setEmailCooldown(res.data.cooldownSeconds || 60);
      }
    } catch (err) {
      setValidationError(err.response?.data?.message || 'Unable to send Email OTP. Please verify email credentials.');
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.trim().length !== 6) {
      setValidationError('Please enter the 6-digit OTP code received on your email');
      return;
    }
    setValidationError('');
    setVerifyingEmailOtp(true);
    try {
      const res = await api.post('/applications/verify-email-otp', { email: email.trim(), otp: emailOtp.trim() });
      if (res.data.success) {
        setEmailVerified(true);
        setEmailOtp('');
      }
    } catch (err) {
      setValidationError(err.response?.data?.message || 'Invalid or expired email OTP code. Please try again.');
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  // 2. Experience Helpers
  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        companyName: '',
        jobRole: '',
        yearsOfExperience: '',
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        employmentType: 'Full Time',
        managerName: '',
        managerContact: '',
        responsibilities: '',
        technologies: '',
        experienceCertificate: ''
      }
    ]);
  };

  const removeExperience = (idx) => {
    setExperiences(experiences.filter((_, i) => i !== idx));
  };

  const updateExp = (idx, field, val) => {
    const updated = [...experiences];
    updated[idx][field] = val;
    setExperiences(updated);
  };

  // 3. Internship Helpers
  const addInternship = () => {
    setInternships([
      ...internships,
      {
        companyName: '',
        internshipRole: '',
        startDate: '',
        endDate: '',
        paid: 'Paid',
        workMode: 'Hybrid',
        managerMentor: '',
        contactDetails: '',
        technologies: '',
        responsibilities: '',
        internshipCertificate: ''
      }
    ]);
  };

  const removeInternship = (idx) => {
    setInternships(internships.filter((_, i) => i !== idx));
  };

  const updateIntern = (idx, field, val) => {
    const updated = [...internships];
    updated[idx][field] = val;
    setInternships(updated);
  };

  // 4. Skills Helpers
  const addSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills([...skills, { name: newSkillName.trim(), level: newSkillLevel }]);
    setNewSkillName('');
  };

  const removeSkill = (idx) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  // 5. Dedicated Resume Upload (FormData with field name "resume")
  const handleResumeFileChange = async (e) => {
    setResumeError('');
    setResumeSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      setResumeError('File too large. Maximum allowed size is 5 MB.');
      return;
    }

    // Check extension
    const allowed = /\.(pdf|doc|docx)$/i;
    if (!allowed.test(file.name)) {
      setResumeError('Invalid file format. Only PDF, DOC, and DOCX files are allowed.');
      return;
    }

    setResumeFileObj(file);
    setUploadingResume(true);

    try {
      const formData = new FormData();
      formData.append('resume', file); // Field name "resume"

      let res;
      try {
        res = await api.post('/applications/upload-resume', formData);
      } catch (uploadErr) {
        // Resilient fallback: upload via JSON base64 if multipart is interrupted
        console.warn('Multipart upload fallback triggered:', uploadErr);
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
        res = await api.post('/applications/upload-resume', {
          fileName: file.name,
          fileData: base64Data,
          size: file.size
        });
      }

      if (res && res.data && res.data.success) {
        setResume(res.data.resume || {
          originalName: file.name,
          storedName: res.data.fileName || file.name,
          filePath: res.data.fileUrl || `/uploads/resumes/${file.name}`,
          fileName: file.name,
          fileUrl: res.data.fileUrl || `/uploads/resumes/${file.name}`,
          size: file.size,
          uploadedAt: new Date().toISOString()
        });
        setResumeSuccessMsg('Resume uploaded successfully.');
      } else {
        setResumeError(res?.data?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to upload resume file';
      setResumeError(errMsg);
    } finally {
      setUploadingResume(false);
    }
  };

  const removeResume = () => {
    setResume(null);
    setResumeFileObj(null);
    setResumeSuccessMsg('');
    setResumeError('');
    if (resumeInputRef.current) {
      resumeInputRef.current.value = '';
    }
  };

  // 6. Form Validation & Step Submission
  const handleFormValidation = (e) => {
    e.preventDefault();
    setValidationError('');

    // Check Basic Details
    if (!jobRole.trim()) { setValidationError('Please enter the Job Role you are applying for'); return; }
    if (!firstName.trim()) { setValidationError('Please enter your First Name'); return; }
    if (!lastName.trim()) { setValidationError('Please enter your Last Name'); return; }
    if (!email.trim()) { setValidationError('Please enter your Email Address'); return; }
    if (!phone.trim()) { setValidationError('Please enter your Phone Number'); return; }
    if (!emailVerified) { 
      setValidationError('Please verify your Email Address with the 6-digit OTP code sent to your Gmail inbox before continuing.'); 
      return; 
    }

    // Check Password
    if (!password) { 
      setValidationError('Please set a password for your candidate account so you can log in later'); 
      return; 
    }
    if (password.length < 6) { 
      setValidationError('Password must be at least 6 characters long'); 
      return; 
    }
    if (password !== confirmPassword) { 
      setValidationError('Confirm Password does not match your chosen Password'); 
      return; 
    }

    // Check Education Details
    if (!tenth.school || !tenth.percentage) { setValidationError('Please complete 10th standard school name and percentage/CGPA'); return; }
    if (!twelfth.school || !twelfth.percentage) { setValidationError('Please complete 12th standard school/college name and percentage'); return; }
    if (!college.collegeName || !college.degree || !college.cgpa) { setValidationError('Please complete College / Higher Education details (College, Degree, CGPA)'); return; }

    // Check Experience if enabled
    if (hasWorkExperience) {
      for (let i = 0; i < experiences.length; i++) {
        if (!experiences[i].companyName || !experiences[i].jobRole || !experiences[i].startDate) {
          setValidationError(`Please fill company name, role, and start date for Work Experience #${i + 1}`);
          return;
        }
      }
    }

    // Check Internship if enabled
    if (hasInternship) {
      for (let i = 0; i < internships.length; i++) {
        if (!internships[i].companyName || !internships[i].internshipRole) {
          setValidationError(`Please fill company name and role for Internship #${i + 1}`);
          return;
        }
      }
    }

    // Check Skills & Resume
    if (skills.length === 0) { setValidationError('Please add at least one technical skill'); return; }
    if (!resume || (!resume.fileName && !resume.originalName)) {
      setValidationError('Please upload your resume before continuing.');
      return;
    }

    const fullApplicationData = {
      jobRole,
      firstName,
      lastName,
      phone,
      email,
      password,
      phoneVerified: true,
      emailVerified: !!emailVerified,
      education: { tenth, twelfth, college },
      hasWorkExperience,
      experience: hasWorkExperience ? experiences : [],
      hasInternship,
      internships: hasInternship ? internships : [],
      skills,
      resume
    };

    onComplete(fullApplicationData);
  };

  return (
    <form onSubmit={handleFormValidation} className="space-y-8">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-mono uppercase font-bold text-orange-600 tracking-wider">Step 1 of 2</span>
          <h2 className="text-xl font-extrabold text-slate-900">Candidate Application Form</h2>
          <p className="text-xs text-slate-500 mt-0.5">Please fill all required academic, professional, and contact details.</p>
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{validationError}</span>
        </div>
      )}

      {/* SECTION 1: BASIC DETAILS & INLINE EMAIL OTP */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          <User className="w-4 h-4 text-orange-600" />
          <span>1. Basic Information</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Applying For / Job Role *</label>
          <input
            type="text"
            required
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="e.g. Senior Full Stack Engineer"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-orange-500 placeholder:text-slate-400 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name *</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-orange-500 placeholder:text-slate-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name *</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Morgan"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-orange-500 placeholder:text-slate-400 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email ID & Send Email OTP Button */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email ID *</label>
            <div className="flex items-center space-x-2">
              <input
                type="email"
                required
                disabled={emailVerified}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-orange-500 disabled:bg-slate-50 disabled:opacity-80 placeholder:text-slate-400 transition-colors"
              />
              {!emailVerified && (
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  disabled={sendingEmailOtp || emailCooldown > 0}
                  className="px-3.5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-60"
                >
                  {sendingEmailOtp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : emailCooldown > 0 ? (
                    <span>Wait {emailCooldown}s</span>
                  ) : (
                    <span>Send OTP</span>
                  )}
                </button>
              )}
              {emailVerified && (
                <span className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Email Verified ✓</span>
                </span>
              )}
            </div>
          </div>

          {/* Phone Number Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-orange-500 placeholder:text-slate-400 transition-colors"
            />
          </div>
        </div>

        {/* Inline Email OTP Verification Box */}
        {emailOtpSent && !emailVerified && (
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-3">
            <div className="flex items-center justify-between text-xs text-orange-800">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">Real OTP sent to your Gmail inbox ({email}).</span>
              </div>
              <button
                type="button"
                onClick={handleSendEmailOtp}
                disabled={sendingEmailOtp || emailCooldown > 0}
                className="text-xs text-orange-700 hover:text-orange-900 underline font-medium disabled:opacity-50 disabled:no-underline"
              >
                {emailCooldown > 0 ? `Resend OTP in ${emailCooldown}s` : 'Resend OTP'}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                maxLength={6}
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit Email OTP"
                className="w-52 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-mono text-center tracking-widest focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleVerifyEmailOtp}
                disabled={verifyingEmailOtp || emailOtp.length !== 6}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {verifyingEmailOtp ? 'Verifying...' : 'Verify Email OTP'}
              </button>
            </div>
          </div>
        )}

        {/* Account Password & Security */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
            <Lock className="w-4 h-4 text-orange-600" />
            <span>Create Account Password (For Candidate Login & Status Tracker)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Portal Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-orange-500 placeholder:text-slate-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Use this password with your email to log in to your portal.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm Password *
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm focus:outline-none transition-colors ${
                  confirmPassword && password !== confirmPassword 
                    ? 'border-red-400 focus:border-red-500' 
                    : confirmPassword && password === confirmPassword
                    ? 'border-emerald-400 focus:border-emerald-500'
                    : 'border-slate-300 focus:border-orange-500'
                }`}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[10px] text-red-600 mt-1">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-[10px] text-emerald-600 mt-1">Passwords match ✓</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: EDUCATION */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          <GraduationCap className="w-4 h-4 text-orange-600" />
          <span>2. Academic Education</span>
        </div>

        {/* 10th */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">10th Standard Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">School Name *</label>
              <input
                type="text"
                required
                value={tenth.school}
                onChange={(e) => setTenth({ ...tenth, school: e.target.value })}
                placeholder="St. Joseph High School"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Board *</label>
              <input
                type="text"
                required
                value={tenth.board}
                onChange={(e) => setTenth({ ...tenth, board: e.target.value })}
                placeholder="CBSE / State"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Passing Year *</label>
              <input
                type="text"
                required
                value={tenth.year}
                onChange={(e) => setTenth({ ...tenth, year: e.target.value })}
                placeholder="2018"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Percentage / CGPA *</label>
            <input
              type="text"
              required
              value={tenth.percentage}
              onChange={(e) => setTenth({ ...tenth, percentage: e.target.value })}
              placeholder="e.g. 92.5%"
              className="w-full sm:w-1/3 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* 12th */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">12th Standard / Diploma Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Junior College / School Name *</label>
              <input
                type="text"
                required
                value={twelfth.school}
                onChange={(e) => setTwelfth({ ...twelfth, school: e.target.value })}
                placeholder="Delhi Public School"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Board *</label>
              <input
                type="text"
                required
                value={twelfth.board}
                onChange={(e) => setTwelfth({ ...twelfth, board: e.target.value })}
                placeholder="CBSE / State"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Passing Year *</label>
              <input
                type="text"
                required
                value={twelfth.year}
                onChange={(e) => setTwelfth({ ...twelfth, year: e.target.value })}
                placeholder="2020"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Percentage / CGPA *</label>
            <input
              type="text"
              required
              value={twelfth.percentage}
              onChange={(e) => setTwelfth({ ...twelfth, percentage: e.target.value })}
              placeholder="e.g. 91%"
              className="w-full sm:w-1/3 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* College */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">College / Higher Education</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">College Name *</label>
              <input
                type="text"
                required
                value={college.collegeName}
                onChange={(e) => setCollege({ ...college, collegeName: e.target.value })}
                placeholder="National Institute of Technology"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Degree Title *</label>
              <input
                type="text"
                required
                value={college.degree}
                onChange={(e) => setCollege({ ...college, degree: e.target.value })}
                placeholder="B.Tech in Computer Science"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Branch / Specialization *</label>
              <input
                type="text"
                required
                value={college.branch}
                onChange={(e) => setCollege({ ...college, branch: e.target.value })}
                placeholder="Computer Science & Engg"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">University *</label>
              <input
                type="text"
                required
                value={college.university}
                onChange={(e) => setCollege({ ...college, university: e.target.value })}
                placeholder="NIT University"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">CGPA / Percentage *</label>
              <input
                type="text"
                required
                value={college.cgpa}
                onChange={(e) => setCollege({ ...college, cgpa: e.target.value })}
                placeholder="8.8 / 10"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: WORK EXPERIENCE */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
            <Briefcase className="w-4 h-4 text-orange-600" />
            <span>3. Work Experience</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-600">Do you have work experience?</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => setHasWorkExperience(true)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  hasWorkExperience ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setHasWorkExperience(false)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  !hasWorkExperience ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>

        {hasWorkExperience ? (
          <div className="space-y-4">
            {experiences.map((exp, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative">
                {experiences.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(idx)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={exp.companyName}
                      onChange={(e) => updateExp(idx, 'companyName', e.target.value)}
                      placeholder="Apex Cloud Solutions"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Job Role *</label>
                    <input
                      type="text"
                      required
                      value={exp.jobRole}
                      onChange={(e) => updateExp(idx, 'jobRole', e.target.value)}
                      placeholder="Full Stack Engineer"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Start Date *</label>
                    <input
                      type="month"
                      required
                      value={exp.startDate}
                      onChange={(e) => updateExp(idx, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">End Date</label>
                    <input
                      type="month"
                      disabled={exp.currentlyWorking}
                      value={exp.endDate}
                      onChange={(e) => updateExp(idx, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Years of Exp</label>
                    <input
                      type="text"
                      value={exp.yearsOfExperience}
                      onChange={(e) => updateExp(idx, 'yearsOfExperience', e.target.value)}
                      placeholder="2.5"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Manager / Reporting Person Name</label>
                    <input
                      type="text"
                      value={exp.managerName}
                      onChange={(e) => updateExp(idx, 'managerName', e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Manager / Company Contact *</label>
                    <input
                      type="text"
                      required
                      value={exp.managerContact}
                      onChange={(e) => updateExp(idx, 'managerContact', e.target.value)}
                      placeholder="manager@company.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addExperience}
              className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 hover:bg-orange-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Experience</span>
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No professional experience selected. Continuing in Fresher stream.</p>
        )}
      </div>

      {/* SECTION 4: INTERNSHIPS (WITH CLEAR PAID / UNPAID FIELD) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900">
            <FileText className="w-4 h-4 text-orange-600" />
            <span>4. Internships</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-600">Have you completed an internship?</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => setHasInternship(true)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  hasInternship ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setHasInternship(false)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  !hasInternship ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>

        {hasInternship ? (
          <div className="space-y-4">
            {internships.map((intern, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative">
                {internships.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInternship(idx)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                
                {/* Company & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={intern.companyName}
                      onChange={(e) => updateIntern(idx, 'companyName', e.target.value)}
                      placeholder="Vanguard Systems"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Internship Role *</label>
                    <input
                      type="text"
                      required
                      value={intern.internshipRole}
                      onChange={(e) => updateIntern(idx, 'internshipRole', e.target.value)}
                      placeholder="Software Engineering Intern"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Dates, Paid / Unpaid, and Work Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Start Date *</label>
                    <input
                      type="month"
                      required
                      value={intern.startDate}
                      onChange={(e) => updateIntern(idx, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">End Date *</label>
                    <input
                      type="month"
                      required
                      value={intern.endDate}
                      onChange={(e) => updateIntern(idx, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Stipend Status *</label>
                    <select
                      value={intern.paid}
                      onChange={(e) => updateIntern(idx, 'paid', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 font-semibold"
                    >
                      <option value="Paid">Paid Internship</option>
                      <option value="Unpaid">Unpaid Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Work Mode</label>
                    <select
                      value={intern.workMode}
                      onChange={(e) => updateIntern(idx, 'workMode', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500"
                    >
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                </div>

                {/* Manager / Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Manager / Mentor Name</label>
                    <input
                      type="text"
                      value={intern.managerMentor}
                      onChange={(e) => updateIntern(idx, 'managerMentor', e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Contact Details (Email/Phone)</label>
                    <input
                      type="text"
                      value={intern.contactDetails}
                      onChange={(e) => updateIntern(idx, 'contactDetails', e.target.value)}
                      placeholder="mentor@vanguard.io"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addInternship}
              className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 hover:bg-orange-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Internship</span>
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No internship records added.</p>
        )}
      </div>

      {/* SECTION 5: SKILLS & RESUME UPLOAD */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <span>5. Technical Skills & Resume</span>
        </div>

        {/* Skills Tag List */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Technical Skills *</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map((skill, idx) => (
              <div key={idx} className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="font-semibold text-slate-900">{skill.name}</span>
                <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200">
                  {skill.level}
                </span>
                <button
                  type="button"
                  onClick={() => removeSkill(idx)}
                  className="text-slate-400 hover:text-red-600 font-bold ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="e.g. Python, Docker, PostgreSQL"
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 placeholder:text-slate-400"
            />
            <select
              value={newSkillLevel}
              onChange={(e) => setNewSkillLevel(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 font-semibold"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              Add Skill
            </button>
          </div>
        </div>

        {/* PROPER RESUME UPLOAD COMPONENT (PDF, DOC, DOCX up to 5MB) */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Resume / CV Document (PDF, DOC, DOCX) *
          </label>

          {resumeError && (
            <div className="mb-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{resumeError}</span>
            </div>
          )}

          {resumeSuccessMsg && (
            <div className="mb-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{resumeSuccessMsg}</span>
            </div>
          )}

          <div className="p-5 border-2 border-dashed border-slate-300 hover:border-orange-400 rounded-xl bg-slate-50 transition-colors">
            {resume && (resume.fileName || resume.originalName) ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 tracking-wide">{resume.fileName || resume.originalName}</p>
                    <p className="text-[11px] text-emerald-700 font-mono mt-0.5">
                      ✓ Uploaded ({resume.size ? `${(resume.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF/DOC'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer border border-slate-300 transition-colors shadow-sm">
                    Change Resume
                    <input
                      ref={resumeInputRef}
                      type="file"
                      name="resume"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleResumeFileChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={removeResume}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200 transition-colors"
                    title="Remove resume"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center mx-auto text-orange-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Upload your Resume or CV</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Accepts PDF, DOC, DOCX up to 5 MB</p>
                </div>

                <label className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-orange-500/20 transition-all">
                  {uploadingResume ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading Resume...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Resume File</span>
                    </>
                  )}
                  <input
                    ref={resumeInputRef}
                    type="file"
                    name="resume"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleResumeFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion & Proceed Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-sm shadow-md shadow-orange-500/20 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5"
        >
          <span>Complete Application & Next: Identity Verification</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
