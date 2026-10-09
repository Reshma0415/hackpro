import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ScanFace, 
  Cpu, 
  Fingerprint, 
  Network, 
  FileCheck2, 
  Lock, 
  ArrowRight, 
  AlertTriangle,
  CheckCircle2,
  Eye,
  Server,
  KeyRound,
  Sparkles
} from 'lucide-react';

export const LandingPage = ({ onApplyClick, onLoginClick }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  const securityPillars = [
    {
      icon: <Fingerprint className="w-6 h-6 text-orange-600" />,
      title: "Zero-Knowledge Legal ID",
      desc: "Instant Government ID format checks with salted SHA-256 hashes and masked last-4 storage. UIDAI privacy compliant mock.",
      badge: "Privacy First"
    },
    {
      icon: <ScanFace className="w-6 h-6 text-amber-600" />,
      title: "Straight-Facing Biometrics",
      desc: "Strict multi-capture straight camera orientation and face consistency verification with real-time pose guidance.",
      badge: "Straight Only"
    },
    {
      icon: <Network className="w-6 h-6 text-orange-600" />,
      title: "Device & IP Telemetry",
      desc: "Passive detection of proxy hops, datacenter IPs, OS/browser discrepancies, and session switching risks.",
      badge: "Risk Signals"
    },
    {
      icon: <Cpu className="w-6 h-6 text-amber-600" />,
      title: "Synthetic Identity Engine",
      desc: "Multi-signal correlation across name, DOB, disposable email domains, and phone reputation to flag review needs.",
      badge: "Heuristic AI"
    },
    {
      icon: <FileCheck2 className="w-6 h-6 text-orange-600" />,
      title: "Tamper-Evident Credentials",
      desc: "End-to-end verification of marksheets, college degree records, and employment verification contacts.",
      badge: "100% Verifiable"
    },
    {
      icon: <Lock className="w-6 h-6 text-amber-600" />,
      title: "Backend Role Fortress",
      desc: "Zero frontend trust. Candidate, HR, and Admin access are strictly determined on the backend via JWT & DB sessions.",
      badge: "Zero-Trust"
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden relative bg-slate-50 text-slate-900">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-200/40 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-amber-200/40 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Trust Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white border border-orange-300 shadow-sm">
            <Sparkles className="w-4 h-4 text-orange-600 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-xs font-bold text-slate-800">
              Next-Gen Candidate Trust & Fraud Intelligence Platform
            </span>
            <span className="px-1.5 py-0.2 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">2026</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto"
          >
            Verify the Person. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 bg-clip-text text-transparent">
              Build Trust in Hiring.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            variants={itemVariants}
            className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed"
          >
            A platform that verifies candidate identity and detects hiring fraud using identity, biometric, device, network and document signals.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={onApplyClick}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl shadow-xl shadow-orange-600/25 hover:shadow-orange-600/35 transform hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-3 group"
            >
              <FileCheck2 className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              <span>Apply for Job</span>
              <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onLoginClick}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-800 hover:text-orange-600 bg-white hover:bg-slate-50 border border-slate-300 hover:border-orange-400 rounded-xl shadow-md transition-all flex items-center justify-center space-x-3"
            >
              <Lock className="w-5 h-5 text-orange-600" />
              <span>Common Login</span>
            </button>
          </motion.div>

          {/* Security Guarantee Pills */}
          <motion.div variants={itemVariants} className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-700 font-semibold">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zero Aadhaar Storage (Masked & Hashed)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Straight Camera Multi-Frame Verification</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Backend-Enforced Authentication</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Live Trust Telemetry Visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-16 relative"
        >
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden text-left bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500 animate-ping" />
                  <h3 className="text-lg font-bold text-slate-900 tracking-wide">Candidate Trust Score Engine</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Real-time holistic evaluation across 10+ risk & identity vector checkpoints</p>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium">Evaluation Protocol:</span>
                <span className="text-xs font-mono text-orange-600 font-bold">CT-ISO-2026-ZERO</span>
              </div>
            </div>

            {/* Visual Vector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-1">
                  <span>Legal Identity</span>
                  <span className="text-orange-600 font-bold font-mono">99.4%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-600 rounded-full w-[99%]" />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">Masked + Salted Hash</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-1">
                  <span>Face Consistency</span>
                  <span className="text-orange-600 font-bold font-mono">98.2%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-600 rounded-full w-[98%]" />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">3 Straight Captures</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-1">
                  <span>Device & IP Risk</span>
                  <span className="text-emerald-600 font-bold font-mono">LOW</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full w-[94%]" />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">No Proxy / Spoofing</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold mb-1">
                  <span>Synthetic Signals</span>
                  <span className="text-orange-600 font-bold font-mono">PASS</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-600 rounded-full w-[96%]" />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-mono">Multi-Factor Matched</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="mt-28">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Multimodal Candidate Verification Architecture
            </h2>
            <p className="text-slate-600 text-sm mt-2 max-w-2xl mx-auto">
              Built to eradicate proxy interviewers, fake resumes, and synthetic candidate profiles before the offer stage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {securityPillars.map((p, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-2xl relative group overflow-hidden bg-white border border-slate-200 hover:border-orange-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 group-hover:border-orange-300 group-hover:bg-orange-50 transition-colors">
                    {p.icon}
                  </div>
                  <span className="text-[11px] font-bold font-mono px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full border border-orange-200">
                    {p.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {p.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Demo Notice */}
      <footer className="border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500 bg-white">
        <p className="max-w-3xl mx-auto">
          Candidate Trust & Fraud Intelligence Platform. Biometric and Government ID integrations are in DEMO/MOCK Sandbox mode.
        </p>
      </footer>
    </div>
  );
};
