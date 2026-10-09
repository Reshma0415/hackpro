import React, { useState } from 'react';
import { GraduationCap, Upload, FileText, Plus, Trash2, CheckCircle, Award } from 'lucide-react';
import api from '../../api/client';

export const Step3_EducationSkills = ({ data, updateData, onNext, onPrev, applicationId }) => {
  const [tenth, setTenth] = useState(data.educationData?.tenth || {
    school: '',
    board: 'CBSE',
    passingYear: '',
    percentage: ''
  });

  const [twelfth, setTwelfth] = useState(data.educationData?.twelfth || {
    school: '',
    board: 'CBSE',
    passingYear: '',
    percentage: ''
  });

  const [colleges, setColleges] = useState(
    data.educationData?.colleges?.length > 0 
      ? data.educationData.colleges 
      : [{
          degree: 'B.Tech in Computer Science',
          branch: 'Computer Science & Engineering',
          college: '',
          university: '',
          startYear: '2020',
          graduationYear: '2024',
          cgpa: ''
        }]
  );

  const [skills, setSkills] = useState(
    data.skillsData?.length > 0
      ? data.skillsData
      : [
          { name: 'React', level: 'Advanced' },
          { name: 'Node.js', level: 'Intermediate' },
          { name: 'TypeScript', level: 'Intermediate' }
        ]
  );

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('Intermediate');

  const [resumeFile, setResumeFile] = useState(data.resumeFile || '');
  const [resumeName, setResumeName] = useState('Candidate_Resume.pdf');
  const [uploadingResume, setUploadingResume] = useState(false);

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeName(file.originalname);
    setUploadingResume(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldType', 'resume');

      const res = await api.post(`/applications/${applicationId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setResumeFile(res.data.fileUrl);
        updateData('resumeFile', res.data.fileUrl);
      }
    } catch (err) {
      console.error('Resume upload error:', err);
    } finally {
      setUploadingResume(false);
    }
  };

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills([...skills, { name: newSkillName.trim(), level: newSkillLevel }]);
    setNewSkillName('');
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, idx) => idx !== index));
  };

  const addCollege = () => {
    setColleges([
      ...colleges,
      {
        degree: '',
        branch: '',
        college: '',
        university: '',
        startYear: '',
        graduationYear: '',
        cgpa: ''
      }
    ]);
  };

  const removeCollege = (index) => {
    setColleges(colleges.filter((_, idx) => idx !== index));
  };

  const updateCollegeField = (index, field, value) => {
    const updated = [...colleges];
    updated[index][field] = value;
    setColleges(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateData('educationData', { tenth, twelfth, colleges });
    updateData('skillsData', skills);
    updateData('resumeFile', resumeFile || 'Candidate_Resume.pdf');
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Education, Skills & Resume</h3>
          <p className="text-xs text-slate-400">Academic records, technical proficiency levels, and curriculum vitae.</p>
        </div>
      </div>

      {/* 10th Standard */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">10th Standard (Secondary Education)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-slate-300 mb-1">School Name *</label>
            <input
              type="text"
              required
              value={tenth.school}
              onChange={(e) => setTenth({ ...tenth, school: e.target.value })}
              placeholder="e.g. St. Joseph High School"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Board *</label>
            <input
              type="text"
              required
              value={tenth.board}
              onChange={(e) => setTenth({ ...tenth, board: e.target.value })}
              placeholder="CBSE / ICSE / State"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Passing Year *</label>
            <input
              type="text"
              required
              value={tenth.passingYear}
              onChange={(e) => setTenth({ ...tenth, passingYear: e.target.value })}
              placeholder="2018"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Percentage / CGPA *</label>
            <input
              type="text"
              required
              value={tenth.percentage}
              onChange={(e) => setTenth({ ...tenth, percentage: e.target.value })}
              placeholder="e.g. 92% or 9.2"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">10th Marksheet (PDF/Image)</label>
            <div className="flex items-center space-x-2">
              <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer flex items-center space-x-1.5 transition-colors border border-slate-700">
                <Upload className="w-3.5 h-3.5" />
                <span>Choose Document</span>
                <input type="file" accept=".pdf,image/*" className="hidden" />
              </label>
              <span className="text-[11px] text-slate-500 truncate">Optional in prototype</span>
            </div>
          </div>
        </div>
      </div>

      {/* 12th Standard */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">12th Standard / Diploma</h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-slate-300 mb-1">School / Junior College *</label>
            <input
              type="text"
              required
              value={twelfth.school}
              onChange={(e) => setTwelfth({ ...twelfth, school: e.target.value })}
              placeholder="e.g. Delhi Public School"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Board *</label>
            <input
              type="text"
              required
              value={twelfth.board}
              onChange={(e) => setTwelfth({ ...twelfth, board: e.target.value })}
              placeholder="CBSE / State"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Passing Year *</label>
            <input
              type="text"
              required
              value={twelfth.passingYear}
              onChange={(e) => setTwelfth({ ...twelfth, passingYear: e.target.value })}
              placeholder="2020"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">Percentage / CGPA *</label>
          <input
            type="text"
            required
            value={twelfth.percentage}
            onChange={(e) => setTwelfth({ ...twelfth, percentage: e.target.value })}
            placeholder="e.g. 90.5%"
            className="w-full sm:w-1/2 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
          />
        </div>
      </div>

      {/* College / Higher Education */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">College & University Degree</h4>
          <button
            type="button"
            onClick={addCollege}
            className="px-3 py-1 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Education</span>
          </button>
        </div>

        {colleges.map((col, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3 relative">
            {colleges.length > 1 && (
              <button
                type="button"
                onClick={() => removeCollege(idx)}
                className="absolute top-3 right-3 text-slate-500 hover:text-red-400 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Degree Title *</label>
                <input
                  type="text"
                  required
                  value={col.degree}
                  onChange={(e) => updateCollegeField(idx, 'degree', e.target.value)}
                  placeholder="e.g. B.Tech in Computer Science"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Branch / Specialization *</label>
                <input
                  type="text"
                  required
                  value={col.branch}
                  onChange={(e) => updateCollegeField(idx, 'branch', e.target.value)}
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">College / Institute *</label>
                <input
                  type="text"
                  required
                  value={col.college}
                  onChange={(e) => updateCollegeField(idx, 'college', e.target.value)}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Affiliated University *</label>
                <input
                  type="text"
                  required
                  value={col.university}
                  onChange={(e) => updateCollegeField(idx, 'university', e.target.value)}
                  placeholder="e.g. NIT University"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Start Year *</label>
                <input
                  type="text"
                  required
                  value={col.startYear}
                  onChange={(e) => updateCollegeField(idx, 'startYear', e.target.value)}
                  placeholder="2020"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Graduation Year *</label>
                <input
                  type="text"
                  required
                  value={col.graduationYear}
                  onChange={(e) => updateCollegeField(idx, 'graduationYear', e.target.value)}
                  placeholder="2024"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">CGPA / % *</label>
                <input
                  type="text"
                  required
                  value={col.cgpa}
                  onChange={(e) => updateCollegeField(idx, 'cgpa', e.target.value)}
                  placeholder="8.9 / 10"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Technical Skills */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Technical Skills</h4>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {skills.map((skill, idx) => (
            <div key={idx} className="flex items-center space-x-2 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs">
              <span className="font-medium text-white">{skill.name}</span>
              <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                {skill.level}
              </span>
              <button
                type="button"
                onClick={() => removeSkill(idx)}
                className="text-slate-400 hover:text-red-400 ml-1"
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
            placeholder="Add skill (e.g. Python, Docker, PostgreSQL)"
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
          />
          <select
            value={newSkillLevel}
            onChange={(e) => setNewSkillLevel(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <button
            type="button"
            onClick={addSkill}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
          >
            Add Skill
          </button>
        </div>
      </div>

      {/* Resume Upload */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">Resume / CV Document *</h4>
        <div className="p-4 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950/60 flex flex-col items-center justify-center text-center">
          <FileText className="w-8 h-8 text-blue-400 mb-2" />
          <p className="text-xs font-semibold text-white">{resumeName || 'Upload your latest resume (PDF, DOC, DOCX)'}</p>
          <p className="text-[11px] text-slate-400 mt-1">Cross-analyzed with education and work history signals</p>
          <label className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer border border-slate-700 transition-colors">
            {uploadingResume ? 'Uploading...' : 'Select Resume File'}
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Navigation */}
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
          Save & Proceed to Identity Verification →
        </button>
      </div>
    </form>
  );
};

