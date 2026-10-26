import React, { useState } from 'react';
import {
  GraduationCap,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserCheck,
  ShieldCheck,
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';
import { Role, User } from '../types/index.ts';
import { api, setStoredToken } from '../services/api.ts';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<Role>('admin');
  const [email, setEmail] = useState('admin@university.edu');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotNotice, setForgotNotice] = useState<string | null>(null);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setError(null);
    setForgotNotice(null);
    if (role === 'admin') {
      setEmail('admin@university.edu');
      setPassword('admin123');
    } else if (role === 'hod') {
      setEmail('hod.cs@university.edu');
      setPassword('hod123');
    } else {
      setEmail('sharma@university.edu');
      setPassword('faculty123');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email/username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setForgotNotice(null);

    try {
      const response = await api.login({
        email: email.trim(),
        password,
        role: selectedRole,
      });

      setStoredToken(response.token);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials and selected role.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to receive password reset instructions.');
      return;
    }
    try {
      const res = await api.forgotPassword(email);
      setForgotNotice(res.message);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to request reset instructions.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top University Branding Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              National Engineering University
            </h1>
            <p className="text-xs text-indigo-300">
              Smart Faculty Overload Management System • DSA Powered
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-indigo-200/80 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Accredited Academic Workload Governance</span>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-6">
        {/* Left Column: Academic Overview & DSA Showcase Highlights */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automated Workload & Algorithmic Balancer</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Balanced Teaching Loads.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-300">
              Zero Faculty Burnout.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            A state-of-the-art academic management platform demonstrating real-world applications of
            <strong> Sorting (Merge & Quick Sort)</strong>, <strong>Priority Queues (Max Heap)</strong>,
            <strong> Greedy Optimization</strong>, <strong>Graph Traversals</strong>, and <strong>Hash Lookups</strong>.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-xs">
              <div className="text-indigo-400 font-bold text-xs flex items-center gap-1.5 mb-1">
                <Users className="w-4 h-4" /> Multi-Role Portal
              </div>
              <p className="text-[11px] text-slate-300">
                Tailored views for University Admin, HODs, and Teaching Faculty.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-xs">
              <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4" /> Greedy Balancer
              </div>
              <p className="text-[11px] text-slate-300">
                Transfers overload hours to available faculty with domain matching.
              </p>
            </div>
          </div>

          {/* Quick Persona Pills */}
          <div className="p-3.5 bg-indigo-950/60 border border-indigo-800/50 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> Quick Demo Test Personas (Click to Load)
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className={`px-2.5 py-1 rounded-lg border text-left transition-all ${
                  selectedRole === 'admin'
                    ? 'bg-purple-600 text-white border-purple-400 font-semibold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                👑 Admin (Dean Academics)
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('hod')}
                className={`px-2.5 py-1 rounded-lg border text-left transition-all ${
                  selectedRole === 'hod'
                    ? 'bg-blue-600 text-white border-blue-400 font-semibold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                🏢 HOD (Dr. Gupta - CSE)
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('faculty')}
                className={`px-2.5 py-1 rounded-lg border text-left transition-all ${
                  selectedRole === 'faculty'
                    ? 'bg-emerald-600 text-white border-emerald-400 font-semibold'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                👨‍🏫 Faculty (Dr. Sharma - 24/18h Overload)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Login Box */}
        <div className="lg:col-span-6">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Academic Portal Login
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Select your academic designation and authenticate to continue.
              </p>
            </div>

            {/* Role Selection Tabs */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('admin')}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-white text-purple-700 shadow-sm font-bold ring-1 ring-purple-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('hod')}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                    selectedRole === 'hod'
                      ? 'bg-white text-blue-700 shadow-sm font-bold ring-1 ring-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>HOD / Coord</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleSelect('faculty')}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                    selectedRole === 'faculty'
                      ? 'bg-white text-emerald-700 shadow-sm font-bold ring-1 ring-emerald-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Faculty</span>
                </button>
              </div>
            </div>

            {/* Error & Notice Banners */}
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <span className="font-bold">Error:</span>
                <span>{error}</span>
              </div>
            )}
            {forgotNotice && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{forgotNotice}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email / Institutional ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@university.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-800">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Authenticating secure session...</span>
                ) : (
                  <>
                    <span>Sign In as {selectedRole.toUpperCase()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
              Enterprise Faculty Workload Optimization & Decision Support Engine
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto py-3 text-center text-xs text-slate-400 border-t border-white/5 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 Smart Faculty Overload Management System. All rights reserved.</span>
        <span className="text-[11px] text-indigo-300">
          Algorithms: Merge Sort, Quick Sort, Max-Heap Priority Queue, Greedy Reassignment
        </span>
      </footer>
    </div>
  );
};
