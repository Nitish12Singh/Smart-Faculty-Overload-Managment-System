import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  Shuffle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Layers,
  ArrowDown,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { WorkloadMeter } from '../components/WorkloadMeter.tsx';

interface SmartBalancerPageProps {
  onRefreshAll: () => void;
}

export const SmartBalancerPage: React.FC<SmartBalancerPageProps> = ({ onRefreshAll }) => {
  const [simulation, setSimulation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedRecs, setAppliedRecs] = useState<Set<string>>(new Set());
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    runOptimization();
  }, []);

  const runOptimization = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.getGreedyBalancerSimulation();
      setSimulation(res);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Optimization run failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRecommendation = async (rec: any) => {
    setApplyingId(rec.id);
    setStatusMsg(null);
    try {
      await api.applyBalancerRecommendation({
        sourceFacultyId: rec.sourceFacultyId,
        targetFacultyId: rec.targetFacultyId,
        courseId: rec.courseId,
      });

      setAppliedRecs((prev) => new Set([...prev, rec.id]));
      setStatusMsg({
        type: 'success',
        text: `Successfully reassigned ${rec.courseCode} from ${rec.sourceFacultyName} to ${rec.targetFacultyName}. Workloads updated in production database!`,
      });
      onRefreshAll();
      // Re-run simulation after database update
      setTimeout(() => {
        runOptimization();
      }, 500);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to apply recommendation.' });
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
            <Shuffle className="w-3.5 h-3.5" />
            <span>Automated Greedy Balancing Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Smart Workload Balancer
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
            Eliminates faculty overload through greedy algorithm heuristics, departmental matching, and capacity headroom balancing.
          </p>
        </div>

        <button
          onClick={runOptimization}
          disabled={loading}
          className="px-5 py-3 bg-white text-indigo-900 hover:bg-indigo-50 active:scale-[0.98] font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer z-10 shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Running Optimization...' : 'Optimize Workload'}</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="font-bold underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Before / After Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs">
          <span className="text-xs font-semibold text-rose-700 block mb-1">
            Overloaded Faculty (Before)
          </span>
          <div className="text-3xl font-black text-rose-700">
            {simulation?.overloadedBeforeCount ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Total overload: +{simulation?.totalOverloadHoursBefore ?? 0} teaching hours
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <span className="text-xs font-semibold text-emerald-700 block mb-1">
            Overloaded Faculty (After Optimization)
          </span>
          <div className="text-3xl font-black text-emerald-700">
            {simulation?.overloadedAfterCount ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Remaining overload: {simulation?.totalOverloadHoursAfter ?? 0}h (Overload fully resolved!)
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-2xs">
          <span className="text-xs font-semibold text-indigo-700 block mb-1">
            Recommended Actions
          </span>
          <div className="text-3xl font-black text-indigo-900">
            {simulation?.recommendations?.length ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Greedy reassignment proposals ready for review
          </div>
        </div>
      </div>

      {/* Recommendations List with Approval Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              System Reassignment Recommendations
            </h3>
            <p className="text-xs text-slate-500">
              Generated by matching domain qualifications and capacity headroom without overloading recipients
            </p>
          </div>
          <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg">
            Approval Required
          </span>
        </div>

        {simulation?.recommendations?.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No further course transfers needed. All faculty are operating within maximum bounds.
          </div>
        ) : (
          <div className="space-y-4">
            {simulation?.recommendations?.map((rec: any) => {
              const isApplied = appliedRecs.has(rec.id);
              const isApplying = applyingId === rec.id;

              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-2xl border transition-all text-xs space-y-3 ${
                    isApplied
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">
                        {rec.courseCode}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{rec.courseName}</span>
                      <span className="text-slate-500">({rec.courseWorkloadUnits} Workload Hours)</span>
                    </div>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
                      Compatibility Score: {rec.compatibilityScore}/100
                    </span>
                  </div>

                  {/* Transfer Pipeline Visualization */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
                    {/* Source */}
                    <div className="sm:col-span-5 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-rose-700 font-bold uppercase">Relieved Faculty</span>
                        <span className="text-slate-400">Current: {rec.sourceBefore}h</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs">{rec.sourceFacultyName}</div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                        New simulated load: {rec.sourceAfter}h (Ceiling: 18h)
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="sm:col-span-2 flex justify-center text-indigo-600">
                      <ArrowRight className="w-5 h-5 hidden sm:block" />
                      <span className="sm:hidden text-xs font-bold text-indigo-600">➔ Transfers to:</span>
                    </div>

                    {/* Target */}
                    <div className="sm:col-span-5 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-emerald-700 font-bold uppercase">Recipient Faculty</span>
                        <span className="text-slate-400">Current: {rec.targetBefore}h</span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs">{rec.targetFacultyName}</div>
                      <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                        New simulated load: {rec.targetAfter}h (Ceiling: 18h)
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700">Reasoning:</span> {rec.reason}
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {isApplied ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Reassignment Applied to Database</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApplyRecommendation(rec)}
                        disabled={isApplying}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isApplying ? 'Applying Reassignment...' : 'Approve & Apply Reassignment'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Before / After Comparative Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
            Before vs. After Optimization Workload Matrix
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-semibold">
              <tr>
                <th className="p-3">Faculty Member</th>
                <th className="p-3">Before Workload</th>
                <th className="p-3">Before Status</th>
                <th className="p-3">After Workload</th>
                <th className="p-3">After Status</th>
                <th className="p-3 text-right">Net Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {simulation?.beforeStats?.map((bItem: any) => {
                const aItem = simulation?.afterStats?.find((a: any) => a.facultyId === bItem.facultyId);
                const diff = (aItem?.workload ?? bItem.workload) - bItem.workload;

                return (
                  <tr key={bItem.facultyId} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{bItem.name}</td>
                    <td className="p-3 font-semibold">{bItem.workload} / {bItem.max}h</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bItem.status === 'Overloaded'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {bItem.status}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-indigo-900">
                      {aItem?.workload ?? bItem.workload} / {bItem.max}h
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          aItem?.status === 'Overloaded'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {aItem?.status ?? bItem.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold">
                      {diff < 0 ? (
                        <span className="text-emerald-700">{diff}h (Relieved)</span>
                      ) : diff > 0 ? (
                        <span className="text-indigo-700">+{diff}h (Absorbed)</span>
                      ) : (
                        <span className="text-slate-400">0h</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
