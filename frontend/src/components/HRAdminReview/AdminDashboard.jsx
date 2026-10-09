import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  UserCheck, 
  FileText, 
  Activity, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Search, 
  Filter, 
  Video, 
  WifiOff, 
  Volume2, 
  MonitorOff, 
  Copy, 
  Eye, 
  RotateCcw,
  Sparkles,
  Database,
  BarChart3,
  ListOrdered
} from 'lucide-react';
import api from '../../api/client';
import { CandidateDetailsModal } from './CandidateDetailsModal';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'candidates' | 'security' | 'hr_users' | 'audit'
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [hrUsers, setHrUsers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Overview & Stats
      const overviewRes = await api.get('/review/admin/overview');
      if (overviewRes.data.success) {
        setStats(overviewRes.data.stats);
        setRecentEvents(overviewRes.data.recentEvents || []);
        setStages(overviewRes.data.stages || []);
      }

      // 2. Candidates
      const candRes = await api.get('/review/candidates');
      if (candRes.data.success) {
        setCandidates(candRes.data.candidates);
      }

      // 3. Security Events
      const secRes = await api.get('/review/admin/security-events');
      if (secRes.data.success) {
        setSecurityEvents(secRes.data.events);
      }

      // 4. Audit Logs
      const auditRes = await api.get('/review/admin/audit-logs');
      if (auditRes.data.success) {
        setAuditLogs(auditRes.data.logs);
      }

      // 5. HR Users
      const hrRes = await api.get('/review/admin/hr-users');
      if (hrRes.data.success) {
        setHrUsers(hrRes.data.hrUsers);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError(err.response?.data?.message || 'Failed to fetch admin intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'SPEECH_DETECTED':
      case 'BACKGROUND_VOICE_DETECTED':
        return <Volume2 className="w-4 h-4 text-amber-400" />;
      case 'TAB_SWITCH':
      case 'WINDOW_BLUR':
        return <MonitorOff className="w-4 h-4 text-orange-400" />;
      case 'FULLSCREEN_EXIT':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'NETWORK_OFFLINE':
      case 'NETWORK_RECOVERY_EXPIRED':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      case 'COPY_PASTE_ATTEMPT':
        return <Copy className="w-4 h-4 text-orange-400" />;
      case 'ASSESSMENT_BLOCKED':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-orange-100 border border-orange-200 text-orange-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admin Platform Control & Oversight</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">
              SUPERADMIN PRIVILEGE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Platform-wide visibility across all candidates, HR actions, proctoring security events, and audit ledgers.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-2 self-start sm:self-auto transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Admin Ledger</span>
        </button>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex space-x-1 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-orange-100 text-orange-800 border border-orange-300 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Platform Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'candidates'
              ? 'bg-orange-100 text-orange-800 border border-orange-300 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Candidates ({candidates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-orange-100 text-orange-800 border border-orange-300 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Live Proctoring Stream ({securityEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hr_users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'hr_users'
              ? 'bg-orange-100 text-orange-800 border border-orange-300 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>HR Accounts ({hrUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-orange-100 text-orange-800 border border-orange-300 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Candidates</span>
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats?.totalCandidates || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">{stats?.totalApplications || 0} Total Applications</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-orange-200 shadow-sm">
              <div className="flex items-center justify-between text-orange-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Assessments</span>
                <Video className="w-4 h-4" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats?.totalAssessments || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">{stats?.totalAttempts || 0} Completed Attempts</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-red-200 shadow-sm">
              <div className="flex items-center justify-between text-red-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Blocked Attempts</span>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <p className="text-3xl font-black text-red-600">{stats?.blockedAttempts || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">Review Required</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm">
              <div className="flex items-center justify-between text-amber-600 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Security Events</span>
                <Activity className="w-4 h-4" />
              </div>
              <p className="text-3xl font-black text-amber-700">{stats?.totalSecurityEvents || 0}</p>
              <p className="text-[11px] text-slate-500 mt-1">Proctoring Telemetry</p>
            </div>
          </div>

          {/* Pipeline Stage Distribution & Live Security Ticker */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stage Distribution */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <ListOrdered className="w-4 h-4 text-orange-600" />
                <span>Recruitment Pipeline Stage Distribution</span>
              </h3>
              <div className="space-y-2.5">
                {stages.map((stg) => (
                  <div key={stg.current_stage} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">{stg.current_stage || 'Application Submitted'}</span>
                    <span className="text-xs font-mono font-bold text-orange-700 px-2.5 py-0.5 bg-orange-100 rounded-full border border-orange-200">
                      {stg.count} Candidates
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Live Proctoring Violations */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-orange-600" />
                  <span>Recent Security Events Stream</span>
                </h3>
                <button
                  onClick={() => setActiveTab('security')}
                  className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                >
                  View All &rarr;
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {recentEvents.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500">
                    No proctoring violations recorded yet.
                  </div>
                ) : (
                  recentEvents.map((evt) => (
                    <div key={evt.eventId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start space-x-3">
                      <div className="mt-0.5">{getEventIcon(evt.eventType)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 font-mono">{evt.eventType}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'N/A'}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          Candidate: <strong className="text-slate-900">{evt.candidateName || evt.candidateEmail || 'Candidate'}</strong>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CANDIDATES DIRECTORY */}
      {activeTab === 'candidates' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidates by name, email, candidate ID, role..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Candidate ID & Name</th>
                  <th className="py-3.5 px-4 font-semibold">Role</th>
                  <th className="py-3.5 px-4 font-semibold">Stage</th>
                  <th className="py-3.5 px-4 font-semibold">Verification</th>
                  <th className="py-3.5 px-4 font-semibold">Risk Level</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates
                  .filter(c => 
                    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.candidateId?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((c) => (
                    <tr key={c.applicationId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-mono text-orange-600 font-bold text-[11px]">{c.candidateId}</div>
                        <div className="font-semibold text-slate-900">{c.fullName}</div>
                        <div className="text-[11px] text-slate-500">{c.email}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-800 font-medium">{c.jobRole}</td>
                      <td className="py-4 px-4 font-semibold text-orange-700">{c.currentStage}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {c.overallStatus || 'Verified'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-600">{c.deviceRiskStatus || 'LOW'}</td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidateId(c.applicationId)}
                          className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Full Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE PROCTORING SECURITY STREAM */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-orange-600" />
                <span>Global Proctoring Security Events Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time streaming violation events captured across all proctored candidate sessions.
              </p>
            </div>
            <span className="font-mono text-xs text-orange-700 bg-orange-100 px-3 py-1 rounded-lg border border-orange-200 font-bold">
              {securityEvents.length} Captured Events
            </span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {securityEvents.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-500">
                Zero security violations recorded across all assessments.
              </div>
            ) : (
              securityEvents.map((evt) => (
                <div
                  key={evt.eventId}
                  className={`p-3.5 rounded-xl border text-xs flex items-start space-x-3 transition-colors ${
                    evt.severity === 'HIGH' || evt.severity === 'CRITICAL'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {getEventIcon(evt.eventType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 font-mono text-xs">{evt.eventType}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          evt.severity === 'CRITICAL' || evt.severity === 'HIGH'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {evt.severity} SEVERITY
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1">
                      Candidate: <strong className="text-slate-900">{evt.candidateName || evt.candidateEmail}</strong> • Attempt ID: <span className="font-mono text-slate-500">{evt.attemptId}</span>
                    </p>
                    <p className="text-slate-700 text-[11px] mt-0.5 font-mono">
                      Reason: {evt.metadata?.reason || evt.metadata?.description || 'Proctoring rule violation triggered'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: HR ACCOUNTS & ACTIVITY */}
      {activeTab === 'hr_users' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Registered HR Reviewers & Recruiters</h3>
            <p className="text-xs text-slate-500 mt-0.5">Authorized accounts permitted to review candidates and schedule assessments.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">User ID & Username</th>
                  <th className="py-3.5 px-4 font-semibold">Email</th>
                  <th className="py-3.5 px-4 font-semibold">Role</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hrUsers.map((hr) => (
                  <tr key={hr.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">{hr.username || hr.id}</td>
                    <td className="py-4 px-4 font-mono text-orange-600 font-medium">{hr.email}</td>
                    <td className="py-4 px-4 font-semibold text-slate-800">{hr.role}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {hr.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-500">
                      {hr.created_at ? new Date(hr.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <span>Immutable System Audit Ledger</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographically tracked record of all human actions, logins, stage advances, and proctoring locks.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-500">
              {auditLogs.length} Events Logged
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start space-x-3">
                <Activity className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 font-mono">{log.action}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">
                    Actor: <strong className="text-slate-900">{log.actorEmail || log.actorId}</strong> ({log.actorRole}) • Target: <span className="font-mono text-slate-600">{log.targetType} ({log.targetId})</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidate Deep Inspection Modal */}
      {selectedCandidateId && (
        <CandidateDetailsModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
          onStatusUpdated={fetchAdminData}
        />
      )}
    </div>
  );
};

