import React from 'react';
import { User, FacultyWorkloadItem, WorkloadSummary } from '../types/index.ts';
import { WorkloadMeter } from '../components/WorkloadMeter.tsx';
import {
  Building2,
  Users,
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  Shuffle,
  GitBranch,
  Inbox,
  ArrowRight,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

interface HodDashboardProps {
  user: User;
  facultyList: FacultyWorkloadItem[];
  summary: WorkloadSummary | null;
  onNavigateTab: (tabId: string) => void;
}

export const HodDashboard: React.FC<HodDashboardProps> = ({
  user,
  facultyList,
  summary,
  onNavigateTab,
}) => {
  // CSE department faculty
  const deptFaculty = facultyList.filter(
    (f) => !user.departmentId || f.departmentId === user.departmentId || f.departmentCode === 'CSE'
  );

  const deptOverloaded = deptFaculty.filter((f) => f.status === 'Overloaded');
  const deptAvailable = deptFaculty.filter((f) => f.status === 'Underload');
  const deptTeachingHours = deptFaculty.reduce((acc, f) => acc + f.teachingHours, 0);
  const deptWorkloadUnits = deptFaculty.reduce((acc, f) => acc + f.totalWorkload, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-xs">
            <Building2 className="w-3.5 h-3.5" />
            <span>Department Coordination Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Computer Science & Engineering Department
          </h2>
          <p className="text-xs sm:text-sm text-blue-100">
            Head of Department: {user.name} • Faculty Allocation & Load Optimization Center
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 z-10">
          <button
            onClick={() => onNavigateTab('balancer')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Shuffle className="w-4 h-4 text-white" />
            <span>Optimize Dept Workload</span>
          </button>
          <button
            onClick={() => onNavigateTab('assignments')}
            className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <GitBranch className="w-4 h-4 text-indigo-600" />
            <span>Assign / Reassign</span>
          </button>
        </div>
      </div>

      {/* Dept KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Department Faculty</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{deptFaculty.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Teaching members</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Dept Load</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{deptWorkloadUnits}h</div>
          <div className="text-[11px] text-slate-400 mt-1">{deptTeachingHours} lecture hours</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-2xs bg-rose-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-700">Overloaded</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">{deptOverloaded.length}</div>
          <div className="text-[11px] text-rose-600 mt-1">
            {deptOverloaded.map((f) => f.name.split(' ')[1] || f.name).join(', ') || 'None'}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-sky-200 shadow-2xs bg-sky-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-sky-800">Available Bandwidth</span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
              <ArrowDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-900">{deptAvailable.length}</div>
          <div className="text-[11px] text-sky-700 mt-1">
            {deptAvailable.map((f) => f.name.split(' ')[1] || f.name).join(', ') || 'None'}
          </div>
        </div>
      </div>

      {/* Dept Workload Balance Scenario Highlight */}
      <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-5 rounded-2xl border border-amber-200 text-xs shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <Shuffle className="w-4 h-4 text-amber-600" />
              <span>Algorithmic Optimization Opportunity Detected</span>
            </div>
            <p className="text-slate-600 max-w-3xl leading-relaxed">
              <strong>Dr. Amit Sharma</strong> is overloaded at <strong>24/18 hours</strong> (+6h overload) while{' '}
              <strong>Dr. Rajesh Verma</strong> has <strong>8 hours of available capacity</strong> (10/18 hours).
              Both specialize in <em>Database Systems</em>. Transferring CS303 will eliminate the department overload!
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('balancer')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs shrink-0 cursor-pointer"
          >
            Review Transfer Recommendation
          </button>
        </div>
      </div>

      {/* Faculty Comparison Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Faculty Workload Comparison</h3>
            <p className="text-xs text-slate-500">Visual capacity and course allocations across CSE</p>
          </div>
          <button
            onClick={() => onNavigateTab('requests')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Review Pending Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptFaculty.map((f) => {
            const headroom = f.maxWorkload - f.totalWorkload;
            return (
              <div
                key={f.facultyId}
                className={`p-4 rounded-2xl border text-xs space-y-3 transition-all ${
                  f.status === 'Overloaded'
                    ? 'border-rose-200 bg-rose-50/20'
                    : f.status === 'Underload'
                    ? 'border-sky-200 bg-sky-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{f.name}</h4>
                    <span className="text-[11px] text-slate-500">
                      {f.designation} • {f.facultyCode}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      f.status === 'Overloaded'
                        ? 'bg-rose-100 text-rose-800'
                        : f.status === 'Underload'
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {f.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <span className="font-semibold text-slate-700">Specialization:</span>{' '}
                  {f.specialization}
                </div>

                <WorkloadMeter
                  current={f.totalWorkload}
                  max={f.maxWorkload}
                  percentage={f.workloadPercentage}
                  status={f.status}
                  size="md"
                />

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{f.courseCount} Assigned Courses</span>
                  <span className="font-bold text-slate-800">
                    {headroom < 0 ? `+${Math.abs(headroom)}h Over` : `${headroom}h Headroom`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
