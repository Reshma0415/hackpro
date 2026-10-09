import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  FileText, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles,
  HelpCircle,
  Video
} from 'lucide-react';
import api from '../../api/client';

export const ScheduleAssessmentModal = ({ candidate, onClose, onScheduled }) => {
  const [title, setTitle] = useState('Technical Competency & Reasoning Assessment');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [windowStartTime, setWindowStartTime] = useState('10:00 AM');
  const [windowEndTime, setWindowEndTime] = useState('12:00 PM');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [instructions, setInstructions] = useState(
    'Ensure continuous camera & microphone permissions. You may start at any time within your scheduled window.'
  );
  const [useCustomQuestions, setUseCustomQuestions] = useState(false);
  const [questions, setQuestions] = useState([
    {
      id: 1,
      question: 'What is the primary difference between synchronous and asynchronous execution in JavaScript?',
      type: 'MULTIPLE_CHOICE',
      options: [
        'Synchronous code blocks further execution until complete; asynchronous allows non-blocking execution via the Event Loop',
        'Asynchronous code runs on a separate physical thread automatically in the V8 engine',
        'Synchronous code can only execute in browser environments, not in Node.js',
        'There is no difference in JavaScript engine execution'
      ],
      correctOption: 0,
      points: 10
    },
    {
      id: 2,
      question: 'Which HTTP status code indicates that the request requires candidate authentication?',
      type: 'MULTIPLE_CHOICE',
      options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '404 Not Found'],
      correctOption: 1,
      points: 10
    },
    {
      id: 3,
      question: 'In database systems, what is the primary purpose of an index on a frequently queried column?',
      type: 'MULTIPLE_CHOICE',
      options: [
        'Faster data retrieval by allowing the engine to locate records without full table scans',
        'Decreases the total disk space required by table records',
        'Eliminates the need for foreign key constraints',
        'Guarantees zero database write latency'
      ],
      correctOption: 0,
      points: 10
    }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: questions.length + 1,
        question: '',
        type: 'MULTIPLE_CHOICE',
        options: ['', '', '', ''],
        correctOption: 0,
        points: 10
      }
    ]);
  };

  const handleUpdateQuestion = (qIndex, field, value) => {
    const updated = [...questions];
    updated[qIndex][field] = value;
    setQuestions(updated);
  };

  const handleUpdateOption = (qIndex, optIndex, val) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = val;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (qIndex) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== qIndex));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledDate || !windowStartTime || !windowEndTime) {
      setError('Please provide the scheduled date and start/end window.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        title,
        scheduledDate,
        windowStartTime,
        windowEndTime,
        durationMinutes: parseInt(durationMinutes, 10) || 60,
        instructions,
        questions: useCustomQuestions ? questions : undefined
      };

      const res = await api.post(`/review/candidates/${candidate.applicationId || candidate.candidateId}/schedule-assessment`, payload);
      if (res.data.success) {
        onScheduled(res.data.assessment);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule assessment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto text-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pb-5 border-b border-slate-200 mb-6">
          <div className="flex items-center space-x-2 text-orange-600 mb-1">
            <Video className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Assessment Scheduling</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Schedule Proctored Assessment for <span className="text-orange-600">{candidate.fullName}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Role: <strong>{candidate.jobRole}</strong> • Candidate ID: <span className="font-mono text-slate-700 font-bold">{candidate.candidateId}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Assessment Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Assessment Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 shadow-sm"
              placeholder="e.g. Full Stack Engineering Technical Assessment"
            />
          </div>

          {/* Date and Window Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                <span>Assessment Date</span>
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>Window Start Time</span>
              </label>
              <input
                type="text"
                required
                value={windowStartTime}
                onChange={(e) => setWindowStartTime(e.target.value)}
                placeholder="e.g. 10:00 AM"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-orange-600" />
                <span>Window End Time</span>
              </label>
              <input
                type="text"
                required
                value={windowEndTime}
                onChange={(e) => setWindowEndTime(e.target.value)}
                placeholder="e.g. 12:00 PM"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 shadow-sm"
              />
            </div>
          </div>

          {/* Duration & Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Duration (Minutes)</label>
              <input
                type="number"
                min={15}
                max={180}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 shadow-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Candidate Instructions</label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 shadow-sm"
                placeholder="Instructions on camera, mic, full screen requirement"
              />
            </div>
          </div>

          {/* Proctoring Policy Summary Card */}
          <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-200 text-xs text-slate-700 space-y-1">
            <div className="font-bold text-orange-700 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Enforced Proctoring Policies</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              • Camera & Microphone streaming • Fullscreen & tab focus monitoring (Warning 1 → Warning 2 → Block on 3rd violation) • Web Audio background speech detection • 3-minute network recovery window before locking.
            </p>
          </div>

          {/* Question Configuration Toggle */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-slate-900">Assessment Questions Bank</span>
                <p className="text-[11px] text-slate-500">
                  {useCustomQuestions ? 'Customize questions for this candidate' : 'Using standardized verified technical question bank (6 questions, 60 points)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUseCustomQuestions(!useCustomQuestions)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors shadow-sm"
              >
                {useCustomQuestions ? 'Use Standard Bank' : 'Customize Questions'}
              </button>
            </div>

            {useCustomQuestions && (
              <div className="space-y-4 mt-4">
                {questions.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-700">Question #{qIdx + 1}</span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      value={q.question}
                      onChange={(e) => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                      placeholder="Enter question text..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 shadow-sm"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctOption === optIdx}
                            onChange={() => handleUpdateQuestion(qIdx, 'correctOption', optIdx)}
                            className="text-orange-600 focus:ring-orange-500"
                          />
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-orange-500 shadow-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Question</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/25 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <span>Scheduling Assessment...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Issue Assessment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
