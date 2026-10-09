import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Volume2, 
  MonitorOff, 
  WifiOff, 
  Copy, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  User, 
  Activity,
  Video,
  FileText
} from 'lucide-react';
import api from '../../api/client';

export const AttemptReviewDrawer = ({ candidate, attempt, securityEvents = [], onClose, onDecisionMade }) => {
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const warningCounts = attempt?.warningCounts || {};
  const isBlocked = attempt?.status === 'BLOCKED' || attempt?.securitySummary === 'Blocked';

  const handleDecision = async (selectedDecision) => {
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post(`/review/attempts/${attempt.attemptId || attempt.id}/decision`, {
        decision: selectedDecision,
        notes: notes || `Reviewed by HR: ${selectedDecision}`
      });

      if (res.data.success) {
        onDecisionMade();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit attempt review decision');
    } finally {
      setSubmitting(false);
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'SPEECH_DETECTED':
      case 'BACKGROUND_VOICE_DETECTED':
        return <Volume2 className="w-4 h-4 text-amber-600" />;
      case 'TAB_SWITCH':
      case 'WINDOW_BLUR':
        return <MonitorOff className="w-4 h-4 text-orange-600" />;
      case 'FULLSCREEN_EXIT':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'NETWORK_OFFLINE':
      case 'NETWORK_RECOVERY_EXPIRED':
        return <WifiOff className="w-4 h-4 text-red-600" />;
      case 'COPY_PASTE_ATTEMPT':
        return <Copy className="w-4 h-4 text-orange-600" />;
      case 'ASSESSMENT_BLOCKED':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      <div className="w-full max-w-2xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col overflow-y-auto p-6 sm:p-8 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isBlocked
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : attempt?.percentage >= 60
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {isBlocked ? 'Blocked - Review Required' : `${attempt?.percentage || 0}% Passed`}
              </span>
              <span className="font-mono text-xs text-slate-500 font-bold">{attempt?.attemptId}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1.5">
              Proctoring & Attempt Audit: <span className="text-orange-600">{candidate?.fullName || 'Candidate'}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Attempt Performance Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500">Score & Grade</span>
            <p className="text-lg font-black text-slate-900 font-mono mt-0.5">
              {attempt?.score || 0} / {attempt?.totalPoints || 60}
            </p>
            <p className="text-[10px] text-emerald-700 font-bold">{attempt?.percentage || 0}% Score</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500">Trust Summary</span>
            <p className={`text-base font-bold mt-0.5 ${
              isBlocked ? 'text-red-700' : 'text-emerald-700'
            }`}>
              {attempt?.securitySummary || 'Clean'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">{attempt?.securityEventsCount || 0} Security Events</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-500">Session Status</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">{attempt?.status || 'COMPLETED'}</p>
            <p className="text-[10px] text-slate-500 font-medium">Camera / Mic Active</p>
          </div>
        </div>

        {/* Warning Counters Breakdown */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
            <ShieldAlert className="w-4 h-4 text-orange-600" />
            <span>Violation Warning Breakdown</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold">Tab Switches</span>
              <p className="text-sm font-bold text-orange-700">{warningCounts.tabSwitches || 0} / 3</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold">Fullscreen Exits</span>
              <p className="text-sm font-bold text-orange-700">{warningCounts.fullscreenExits || 0} / 3</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold">Voice Detected</span>
              <p className="text-sm font-bold text-orange-700">{warningCounts.backgroundVoice || 0} / 3</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold">Network Drops</span>
              <p className="text-sm font-bold text-orange-700">{warningCounts.networkDrops || 0} / 3</p>
            </div>
          </div>
        </div>

        {/* Security Events Timeline Feed */}
        <div className="flex-1 space-y-3 mb-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
            <span>Live Security Audit Timeline</span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">
              {securityEvents.length} Recorded Logs
            </span>
          </h3>

          {securityEvents.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 font-medium">
              <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
              <span>Clean session. Zero security violations recorded.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {securityEvents.map((evt, idx) => (
                <div 
                  key={evt.eventId || idx}
                  className={`p-3 rounded-xl border text-xs flex items-start space-x-3 transition-colors ${
                    evt.severity === 'HIGH' || evt.severity === 'CRITICAL'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {getEventIcon(evt.eventType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono text-[11px]">{evt.eventType}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      {evt.metadata?.reason || evt.metadata?.description || `Security event ${evt.eventType} triggered with severity ${evt.severity}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HR / Review Decision Actions */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 mt-auto shadow-sm">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Human-in-the-Loop Decision</h4>
          <p className="text-[11px] text-slate-500 font-medium">
            Advisory Protocol: Select an action based on proctoring signals and assessment scores.
          </p>

          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add reviewer notes / rationale..."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 shadow-sm"
          />

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDecision('APPROVED')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-colors disabled:opacity-50 shadow-sm"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Approve Assessment</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDecision('RETEST_ALLOWED')}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-colors disabled:opacity-50 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Allow Retest</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleDecision('REJECTED')}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-colors disabled:opacity-50 shadow-sm"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Candidate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
