import React from 'react';
import { WorkloadSummary, FacultyWorkloadItem } from '../types/index.ts';
import { WorkloadMeter } from '../components/WorkloadMeter.tsx';
import {
  Users,
  Building2,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowDown,
  Inbox,
  Shuffle,
  Binary,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface AdminDashboardProps {
  summary: WorkloadSummary | null;
  facultyList: FacultyWorkloadItem[];
  onNavigateTab: (tabId: string) => void;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  summary,
  facultyList,
  onNavigateTab,
}) => {
  const overloadedFaculty = facultyList.filter((f) => f.status === 'Overloaded');
  const availableFaculty = facultyList.filter((f) => f.status === 'Underload');

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Academic Workload Governance Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            University Academic Administration
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
            Real-time algorithmic monitoring of teaching hours, capacity headroom, and automated course
            reassignments powered by greedy balancing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
          <button
            onClick={() => onNavigateTab('balancer')}
            className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Shuffle className="w-4 h-4 text-indigo-600" />
            <span>Smart Workload Balancer</span>
          </button>
          <button
            onClick={() => onNavigateTab('dsa')}
            className="px-4 py-2.5 bg-indigo-700/80 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl border border-indigo-400/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Binary className="w-4 h-4 text-indigo-300" />
            <span>DSA Lab & Viva</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Faculty */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Faculty</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{summary?.totalFaculty ?? 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {summary?.totalDepartments ?? 0} academic departments
          </div>
        </div>

        {/* Teaching Workload Units */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Teaching Hours</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {summary?.totalTeachingHours ?? 0}h
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary?.totalWorkloadUnits ?? 0} total weighted workload units
          </div>
        </div>

        {/* Overloaded Faculty */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-2xs bg-rose-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-700">Overloaded Faculty</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700">
            {summary?.overloadFaculty ?? 0}
          </div>
          <div className="text-[11px] text-rose-600/90 mt-1">
            Exceeding 18h maximum limit
          </div>
        </div>

        {/* Pending Requests Queue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-800">Pending Requests</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900">
            {summary?.pendingRequestsCount ?? 0}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            In FIFO request approval queue
          </div>
        </div>
      </div>

      {/* Workload Status Distribution Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Faculty Workload Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown by current teaching load status</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Normal ({summary?.normalFaculty ?? 0})
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Overloaded ({summary?.overloadFaculty ?? 0})
            </span>
            <span className="flex items-center gap-1.5 text-sky-700">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              Underloaded ({summary?.underloadFaculty ?? 0})
            </span>
          </div>
        </div>

        {/* Stacked Percentage Bar */}
        {summary && summary.totalFaculty > 0 && (
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${(summary.normalFaculty / summary.totalFaculty) * 100}%` }}
              className="bg-emerald-500 h-full"
              title={`Normal: ${summary.normalFaculty}`}
            />
            <div
              style={{ width: `${(summary.overloadFaculty / summary.totalFaculty) * 100}%` }}
              className="bg-rose-500 h-full"
              title={`Overload: ${summary.overloadFaculty}`}
            />
            <div
              style={{ width: `${(summary.underloadFaculty / summary.totalFaculty) * 100}%` }}
              className="bg-sky-500 h-full"
              title={`Underload: ${summary.underloadFaculty}`}
            />
          </div>
        )}
      </div>

      {/* Two Column Section: Overloaded Attention vs Available Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overloaded Alert Card */}
        <div className="bg-white rounded-2xl border border-rose-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-rose-50/70 border-b border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                Attention Required: Overloaded Faculty ({overloadedFaculty.length})
              </h4>
            </div>
            <button
              onClick={() => onNavigateTab('balancer')}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
            >
              <span>Balance Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {overloadedFaculty.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                All faculty are within safe workload limits.
              </p>
            ) : (
              overloadedFaculty.map((f) => (
                <div
                  key={f.facultyId}
                  className="p-3 bg-rose-50/30 border border-rose-100 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900">{f.name}</span>
                      <span className="text-[11px] text-slate-500 ml-2">
                        {f.departmentCode} • {f.facultyCode}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 text-rose-800">
                      +{f.overloadAmount}h Overload
                    </span>
                  </div>
                  <WorkloadMeter
                    current={f.totalWorkload}
                    max={f.maxWorkload}
                    percentage={f.workloadPercentage}
                    status={f.status}
                    size="sm"
                  />
                  <div className="text-[11px] text-slate-600">
                    Assigned: {f.courses.map((c) => `${c.courseCode} (${c.workloadUnits}h)`).join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Available Capacity Card */}
        <div className="bg-white rounded-2xl border border-sky-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-sky-50/70 border-b border-sky-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider">
                Available Teaching Bandwidth ({availableFaculty.length})
              </h4>
            </div>
            <button
              onClick={() => onNavigateTab('assignments')}
              className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1"
            >
              <span>Assign Course</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {availableFaculty.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No faculty currently have significant idle bandwidth.
              </p>
            ) : (
              availableFaculty.map((f) => {
                const headroom = f.maxWorkload - f.totalWorkload;
                return (
                  <div
                    key={f.facultyId}
                    className="p-3 bg-sky-50/30 border border-sky-100 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs text-slate-900">{f.name}</span>
                        <span className="text-[11px] text-slate-500 ml-2">
                          {f.departmentCode} • {f.specialization}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-sky-100 text-sky-800">
                        {headroom}h Available
                      </span>
                    </div>
                    <WorkloadMeter
                      current={f.totalWorkload}
                      max={f.maxWorkload}
                      percentage={f.workloadPercentage}
                      status={f.status}
                      size="sm"
                    />
                    <div className="text-[11px] text-slate-600">
                      Ideal recipient for database or networking course reassignments.
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Full Faculty Workload Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Faculty Roster & Workload Status</h3>
            <p className="text-xs text-slate-500">Live academic allocations across university</p>
          </div>
          <button
            onClick={() => onNavigateTab('faculty')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Manage All Faculty</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Faculty Code</th>
                <th className="p-3">Name & Title</th>
                <th className="p-3">Department</th>
                <th className="p-3">Specialization</th>
                <th className="p-3">Courses</th>
                <th className="p-3 min-w-[180px]">Workload Progress</th>
                <th className="p-3">Total / Max</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {facultyList.map((f) => (
                <tr key={f.facultyId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono font-medium text-slate-600">{f.facultyCode}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{f.name}</div>
                    <div className="text-[11px] text-slate-400">{f.designation}</div>
                  </td>
                  <td className="p-3">{f.departmentName}</td>
                  <td className="p-3 text-[11px] text-slate-500 max-w-[160px] truncate" title={f.specialization}>
                    {f.specialization}
                  </td>
                  <td className="p-3 font-semibold">{f.courseCount}</td>
                  <td className="p-3">
                    <WorkloadMeter
                      current={f.totalWorkload}
                      max={f.maxWorkload}
                      percentage={f.workloadPercentage}
                      status={f.status}
                      showLabels={false}
                      size="sm"
                    />
                  </td>
                  <td className="p-3 font-semibold">
                    {f.totalWorkload} / {f.maxWorkload}h
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        f.status === 'Overloaded'
                          ? 'bg-rose-100 text-rose-800'
                          : f.status === 'Near Limit'
                          ? 'bg-amber-100 text-amber-800'
                          : f.status === 'Underload'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
