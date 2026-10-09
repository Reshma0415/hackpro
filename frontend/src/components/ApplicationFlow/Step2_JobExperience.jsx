import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, Calendar, Building, Award, Mail } from 'lucide-react';

export const Step2_JobExperience = ({ data, updateData, onNext, onPrev }) => {
  const [jobData, setJobData] = useState({
    jobRole: data.jobData?.jobRole || 'Full Stack Engineer',
    employmentType: data.jobData?.employmentType || 'Full Time',
    experienceType: data.jobData?.experienceType || 'Experienced' // 'Fresher' | 'Experienced'
  });

  const [experiences, setExperiences] = useState(
    data.experienceData?.length > 0 
      ? data.experienceData 
      : [{
          companyName: '',
          jobTitle: '',
          employmentType: 'Full Time',
          startDate: '',
          endDate: '',
          currentlyWorking: false,
          yearsOfExperience: '',
          responsibilities: '',
          technologies: '',
          verificationContact: ''
        }]
  );

  const [hasInternship, setHasInternship] = useState(
    data.internshipData?.length > 0 ? 'Yes' : 'No'
  );

  const [internships, setInternships] = useState(
    data.internshipData?.length > 0 
      ? data.internshipData 
      : [{
          company: '',
          role: '',
          startDate: '',
          endDate: '',
          paid: 'Paid',
          workMode: 'Hybrid',
          technologies: '',
          responsibilities: ''
        }]
  );

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        companyName: '',
        jobTitle: '',
        employmentType: 'Full Time',
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        yearsOfExperience: '',
        responsibilities: '',
        technologies: '',
        verificationContact: ''
      }
    ]);
  };

  const removeExperience = (index) => {
    setExperiences(experiences.filter((_, idx) => idx !== index));
  };

  const updateExpField = (index, field, value) => {
    const updated = [...experiences];
    updated[index][field] = value;
    setExperiences(updated);
  };

  const addInternship = () => {
    setInternships([
      ...internships,
      {
        company: '',
        role: '',
        startDate: '',
        endDate: '',
        paid: 'Paid',
        workMode: 'Hybrid',
        technologies: '',
        responsibilities: ''
      }
    ]);
  };

  const removeInternship = (index) => {
    setInternships(internships.filter((_, idx) => idx !== index));
  };

  const updateInternshipField = (index, field, value) => {
    const updated = [...internships];
    updated[index][field] = value;
    setInternships(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateData('jobData', jobData);
    updateData('experienceData', jobData.experienceType === 'Experienced' ? experiences : []);
    updateData('internshipData', hasInternship === 'Yes' ? internships : []);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Job & Work Experience</h3>
          <p className="text-xs text-slate-400">Specify role preference, professional experience, and verifiable employer contacts.</p>
        </div>
      </div>

      {/* Target Role & Employment Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Applying For / Job Role *</label>
          <input
            type="text"
            required
            value={jobData.jobRole}
            onChange={(e) => setJobData({ ...jobData, jobRole: e.target.value })}
            placeholder="e.g. Senior Full Stack Engineer"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Employment Type *</label>
          <select
            value={jobData.employmentType}
            onChange={(e) => setJobData({ ...jobData, employmentType: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="Full Time">Full Time</option>
            <option value="Part Time">Part Time</option>
            <option value="Contract">Contract</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Experience Level *</label>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setJobData({ ...jobData, experienceType: 'Fresher' })}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                jobData.experienceType === 'Fresher' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              Fresher
            </button>
            <button
              type="button"
              onClick={() => setJobData({ ...jobData, experienceType: 'Experienced' })}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                jobData.experienceType === 'Experienced' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              Experienced
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Experience Records if Experienced */}
      {jobData.experienceType === 'Experienced' && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Work Experience History</h4>
            <button
              type="button"
              onClick={addExperience}
              className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Experience</span>
            </button>
          </div>

          {experiences.map((exp, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 relative">
              {experiences.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExperience(idx)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={exp.companyName}
                    onChange={(e) => updateExpField(idx, 'companyName', e.target.value)}
                    placeholder="e.g. Apex Cloud Solutions"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={exp.jobTitle}
                    onChange={(e) => updateExpField(idx, 'jobTitle', e.target.value)}
                    placeholder="e.g. Full Stack Developer"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="month"
                    required
                    value={exp.startDate}
                    onChange={(e) => updateExpField(idx, 'startDate', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">End Date</label>
                  <input
                    type="month"
                    disabled={exp.currentlyWorking}
                    value={exp.endDate}
                    onChange={(e) => updateExpField(idx, 'endDate', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Years of Exp</label>
                  <input
                    type="text"
                    value={exp.yearsOfExperience}
                    onChange={(e) => updateExpField(idx, 'yearsOfExperience', e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`current-${idx}`}
                  checked={exp.currentlyWorking}
                  onChange={(e) => updateExpField(idx, 'currentlyWorking', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                />
                <label htmlFor={`current-${idx}`} className="text-xs text-slate-400">Currently Working Here</label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Key Technologies / Skills *</label>
                  <input
                    type="text"
                    required
                    value={exp.technologies}
                    onChange={(e) => updateExpField(idx, 'technologies', e.target.value)}
                    placeholder="e.g. React, Node.js, Postgres, AWS"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Verification Contact (HR/Manager Email) *</label>
                  <input
                    type="email"
                    required
                    value={exp.verificationContact}
                    onChange={(e) => updateExpField(idx, 'verificationContact', e.target.value)}
                    placeholder="e.g. hr@company.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Core Responsibilities</label>
                <textarea
                  rows={2}
                  value={exp.responsibilities}
                  onChange={(e) => updateExpField(idx, 'responsibilities', e.target.value)}
                  placeholder="Summarize key projects, metrics, and achievements..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Internship Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Internship History</h4>
            <p className="text-[11px] text-slate-400">Have you completed any internships?</p>
          </div>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setHasInternship('Yes')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                hasInternship === 'Yes' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setHasInternship('No')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                hasInternship === 'No' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              No
            </button>
          </div>
        </div>

        {hasInternship === 'Yes' && (
          <div className="space-y-4">
            {internships.map((intern, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 relative">
                {internships.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInternship(idx)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Company / Organization *</label>
                    <input
                      type="text"
                      required
                      value={intern.company}
                      onChange={(e) => updateInternshipField(idx, 'company', e.target.value)}
                      placeholder="e.g. Vanguard Systems"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Internship Role *</label>
                    <input
                      type="text"
                      required
                      value={intern.role}
                      onChange={(e) => updateInternshipField(idx, 'role', e.target.value)}
                      placeholder="e.g. Software Engineering Intern"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Start Date *</label>
                    <input
                      type="month"
                      required
                      value={intern.startDate}
                      onChange={(e) => updateInternshipField(idx, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">End Date *</label>
                    <input
                      type="month"
                      required
                      value={intern.endDate}
                      onChange={(e) => updateInternshipField(idx, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Compensation</label>
                    <select
                      value={intern.paid}
                      onChange={(e) => updateInternshipField(idx, 'paid', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Work Mode</label>
                    <select
                      value={intern.workMode}
                      onChange={(e) => updateInternshipField(idx, 'workMode', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                    >
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addInternship}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Internship</span>
            </button>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
        >
          Save & Continue to Education →
        </button>
      </div>
    </form>
  );
};

