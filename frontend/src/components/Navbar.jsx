import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, LogOut, FileText, Activity, User, ShieldAlert, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OsintScannerModal } from './HRAdminReview/OsintScannerModal';

export const Navbar = ({ currentView, setView, onStartApplication }) => {
  const { user, role, logout, isAuthenticated, isHR, isAdmin, isCandidate } = useAuth();
  const [showOsintModal, setShowOsintModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => {
              if (currentView !== 'secure_assessment') {
                setView('landing');
              }
            }}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 p-0.5 shadow-md shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Candidate<span className="text-orange-600">Trust</span></span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full">
                  Fraud Intel
                </span>
              </div>
              <p className="text-[11px] text-slate-500 -mt-0.5">Identity & Biometric Trust System</p>
            </div>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center space-x-3">
            {/* OSINT Scanner Live Tool Button (HR and Admin ONLY - Hidden from Candidates) */}
            {(isHR || isAdmin) && (
              <button
                type="button"
                onClick={() => setShowOsintModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-orange-600 border border-orange-300 hover:border-orange-400 shadow-sm transition-all"
                title="Open OSINT Intelligence Scanner"
              >
                <Radio className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                <span className="hidden sm:inline">OSINT Scanner</span>
              </button>
            )}

            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <button
                    onClick={() => setView('admin_dashboard')}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentView === 'admin_dashboard'
                        ? 'bg-orange-50 text-orange-700 border border-orange-300 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-orange-600" />
                    <span>Admin Center</span>
                  </button>
                )}

                {(isHR || isAdmin) && (
                  <button
                    onClick={() => setView('hr_review')}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentView === 'hr_review'
                        ? 'bg-orange-50 text-orange-700 border border-orange-300 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-orange-600" />
                    <span>HR Review Ledger</span>
                  </button>
                )}

                {isCandidate && (
                  <button
                    onClick={() => setView('candidate_portal')}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      currentView === 'candidate_portal'
                        ? 'bg-orange-50 text-orange-700 border border-orange-300 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-orange-600" />
                    <span>My Recruitment Status</span>
                  </button>
                )}

                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

                {/* User badge with backend-authenticated role */}
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  <div className={`w-2 h-2 rounded-full ${role === 'ADMIN' ? 'bg-amber-500' : role === 'HR' ? 'bg-orange-500' : 'bg-emerald-500'} animate-pulse`} />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">{user.email}</p>
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{role}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setView('landing');
                  }}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onStartApplication}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 transition-all flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Apply for Job</span>
                </button>

                <button
                  onClick={() => setView('login')}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-orange-600 bg-white hover:bg-slate-50 border border-slate-300 hover:border-orange-400 rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-orange-600" />
                  <span>Login</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* OSINT Live Investigation Modal */}
      <OsintScannerModal
        isOpen={showOsintModal}
        onClose={() => setShowOsintModal(false)}
      />
    </>
  );
};
