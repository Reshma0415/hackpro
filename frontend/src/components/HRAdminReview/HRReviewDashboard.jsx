import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Search, 
  Filter, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  User,
  Fingerprint,
  ScanFace,
  Network,
  Cpu,
  FileCheck2,
  Calendar,
  Video,
  ShieldAlert,
  Sparkles,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '../../api/client';
import { CandidateDetailsModal } from './CandidateDetailsModal';
import { ScheduleAssessmentModal } from './ScheduleAssessmentModal';
import { AttemptReviewDrawer } from './AttemptReviewDrawer';

export const HRReviewDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');

  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [schedulingCandidate, setSchedulingCandidate] = useState(null);
  const [reviewingAttemptCandidate, setReviewingAttemptCandidate] = useState(null);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/review/candidates');
      if (res.data.success) {
        setCandidates(res.data.candidates);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load candidate review list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = 
      (c.fullName && c.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.candidateId && c.candidateId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.jobRole && c.jobRole.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'ALL' || 
      (c.overallStatus && c.overallStatus.toLowerCase() === statusFilter.toLowerCase());

    const matchesStage = 
      stageFilter === 'ALL' || 
      (c.currentStage && c.currentStage.toLowerCase() === stageFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesStage;
  });

  // Calculate Quick Stats
  const totalCount = candidates.length;
  const verifiedCount = candidates.filter(c => c.overallStatus === 'Verified').length;
  const needsReviewCount = candidates.filter(c => c.overallStatus === 'Needs Review').length;
  const assessmentCount = candidates.filter(c => c.currentStage === 'Assessment Scheduled' || c.currentStage === 'Assessment Completed').length;
  const selectedCount = candidates.filter(c => c.currentStage === 'Selected').length;

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'Apply':
      case 'Application Submitted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">1. Apply</span>;
      case 'Identity Verification':
      case 'Verification':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">2. Identity</span>;
      case 'Resume Analysis':
      case 'HR Review':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">3. Resume Analysis</span>;
      case 'Shortlisted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Shortlisted</span>;
      case 'Assessment':
      case 'Assessment Scheduled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">4. Assessment</span>;
      case 'Assessment Completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Asm Done</span>;
      case 'Interview':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">5. Interview</span>;
      case 'Offer':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">6. Offer Extended</span>;
      case 'Onboarding':
      case 'Selected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">7. Onboarding ✓</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Rejected ✗</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">{stage}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Verified</span>
          </span>
        );
      case 'Needs Review':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Needs Review</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-slate-50 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">HR Recruitment & Trust Ledger</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Zero-Trust hiring workflow evaluating candidate identity, straight biometrics, assessment scheduling, and proctoring audits.
          </p>
        </div>

        <button
          onClick={fetchCandidates}
          disabled={loading}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl flex items-center space-x-2 self-start sm:self-auto transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Candidates</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
          <p className="text-[10px] text-slate-400 font-medium">Active applications</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Verified Identity</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{verifiedCount}</p>
          <p className="text-[10px] text-slate-400 font-medium">Passed checksums</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-sm">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Needs Review</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{needsReviewCount}</p>
          <p className="text-[10px] text-slate-400 font-medium">Human advisory check</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-orange-200 shadow-sm">
          <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Assessments</span>
          <p className="text-2xl font-black text-orange-600 mt-1">{assessmentCount}</p>
          <p className="text-[10px] text-slate-400 font-medium">Scheduled / Completed</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-purple-200 col-span-2 sm:col-span-1 shadow-sm">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Selected</span>
          <p className="text-2xl font-black text-purple-600 mt-1">{selectedCount}</p>
          <p className="text-[10px] text-slate-400 font-medium">Final hiring stage</p>
        </div>
      </div>

      {/* Security Advisory Protocol Banner */}
      <div className="p-4 rounded-xl bg-white border border-orange-200 text-xs text-slate-700 flex items-start space-x-3 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-900">Advisory Human-in-the-Loop Protocol</p>
          <p className="text-slate-500 mt-0.5">
            Use risk signals and proctoring audits as supporting evidence. Legitimate network issues provide 3-minute grace windows; decisions require manual HR authorization.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by candidate ID (CT-2026-XXXXXX), name, email, or role..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-orange-500 shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-orange-500 shadow-sm"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="Verified">Verified Only</option>
            <option value="Needs Review">Needs Review Only</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-orange-500 shadow-sm"
          >
            <option value="ALL">All Pipeline Stages</option>
            <option value="Application Submitted">1. Application Submitted</option>
            <option value="Verification">2. Verification</option>
            <option value="HR Review">3. HR Review</option>
            <option value="Shortlisted">4. Shortlisted</option>
            <option value="Assessment Scheduled">5. Assessment Scheduled</option>
            <option value="Assessment Completed">6. Assessment Completed</option>
            <option value="Interview">7. Interview</option>
            <option value="Selected">8. Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Candidate Review Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xl">
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Loading Candidate Roster...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs font-medium">
            No candidate records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Candidate ID & Name</th>
                  <th className="py-3.5 px-4 font-bold">Job Role</th>
                  <th className="py-3.5 px-4 font-bold">Govt ID Check</th>
                  <th className="py-3.5 px-4 font-bold">Biometrics</th>
                  <th className="py-3.5 px-4 font-bold">Stage & Status</th>
                  <th className="py-3.5 px-4 font-bold">Assessment / Proctor</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((c) => (
                  <tr 
                    key={c.applicationId}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Candidate ID & Name */}
                    <td className="py-4 px-4">
                      <div className="font-mono text-orange-600 font-extrabold text-[11px] mb-0.5">
                        {c.candidateId}
                      </div>
                      <div className="font-bold text-slate-900">{c.fullName}</div>
                      <div className="text-[11px] text-slate-500">{c.email}</div>
                    </td>

                    {/* Job Role */}
                    <td className="py-4 px-4">
                      <div className="text-slate-800 font-semibold">{c.jobRole}</div>
                      <div className="text-[11px] text-slate-500">{c.employmentType}</div>
                    </td>

                    {/* Govt ID */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                        <Fingerprint className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{c.govtIdType}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 font-semibold">{c.govtIdMasked}</div>
                    </td>

                    {/* Biometric */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                        <ScanFace className="w-3.5 h-3.5 text-emerald-600" />
                        <span>3 Straight Frames</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 font-semibold">Match: 98.2%</div>
                    </td>

                    {/* Stage & Status */}
                    <td className="py-4 px-4 space-y-1">
                      <div>{getStageBadge(c.currentStage)}</div>
                      <div>{getStatusBadge(c.overallStatus)}</div>
                    </td>

                    {/* Assessment / Proctoring Summary */}
                    <td className="py-4 px-4">
                      {c.assessmentAttempt ? (
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            c.assessmentAttempt.status === 'BLOCKED'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            <Video className="w-3 h-3 text-emerald-600" />
                            <span>{c.assessmentAttempt.percentage}% • {c.assessmentAttempt.securitySummary}</span>
                          </span>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {c.assessmentAttempt.securityEventsCount || 0} Security Flags
                          </div>
                        </div>
                      ) : c.currentStage === 'Assessment Scheduled' ? (
                        <span className="text-[10px] font-mono text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 font-bold">
                          Assessment Window Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Not Scheduled</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidateId(c.applicationId)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors shadow-sm"
                          title="Inspect full candidate details"
                        >
                          <Eye className="w-3.5 h-3.5 text-orange-600" />
                          <span>Inspect</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSchedulingCandidate(c)}
                          className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold inline-flex items-center space-x-1 transition-colors shadow-sm"
                          title="Schedule Proctored Assessment"
                        >
                          <Calendar className="w-3.5 h-3.5 text-orange-600" />
                          <span>Schedule</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Deep Inspection Modal */}
      {selectedCandidateId && (
        <CandidateDetailsModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
          onStatusUpdated={fetchCandidates}
        />
      )}

      {/* Assessment Scheduling Modal */}
      {schedulingCandidate && (
        <ScheduleAssessmentModal
          candidate={schedulingCandidate}
          onClose={() => setSchedulingCandidate(null)}
          onScheduled={fetchCandidates}
        />
      )}
    </div>
  );
};
