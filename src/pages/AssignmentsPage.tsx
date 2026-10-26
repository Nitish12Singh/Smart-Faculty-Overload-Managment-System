import React, { useState } from 'react';
import { FacultyWorkloadItem, Course } from '../types/index.ts';
import { GitBranch, Plus, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api.ts';

interface AssignmentsPageProps {
  facultyList: FacultyWorkloadItem[];
  courses: Course[];
  onRefresh: () => void;
  canManage: boolean;
}

export const AssignmentsPage: React.FC<AssignmentsPageProps> = ({
  facultyList,
  courses,
  onRefresh,
  canManage,
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedFacId, setSelectedFacId] = useState<number>(facultyList[0]?.facultyId || 1);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(courses[0]?.id || 1);
  const [targetFacId, setTargetFacId] = useState<number>(facultyList[1]?.facultyId || 2);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      await api.assignCourse(Number(selectedFacId), Number(selectedCourseId));
      setMsg({ type: 'success', text: 'Course assigned and faculty workload updated' });
      setShowAssignModal(false);
      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to assign course' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    try {
      await api.reassignCourse(Number(selectedFacId), Number(targetFacId), Number(selectedCourseId));
      setMsg({ type: 'success', text: 'Course transferred successfully and workloads recalculated for both faculty members.' });
      setShowReassignModal(false);
      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to reassign course' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Course Allocation & Teaching Assignment Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time assignment and manual transfer of subjects across university faculty
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Course</span>
            </button>
            <button
              onClick={() => setShowReassignModal(true)}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <GitBranch className="w-4 h-4 text-indigo-600" />
              <span>Transfer / Reassign</span>
            </button>
          </div>
        )}
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="font-bold underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Allocation Matrix Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
            Faculty Teaching Portfolio Allocations
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {facultyList.map((f) => (
            <div key={f.facultyId} className="p-5 hover:bg-slate-50/60 transition-colors space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{f.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({f.facultyCode})</span>
                    <span className="text-[11px] text-indigo-700 font-semibold">{f.departmentName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Specialization: {f.specialization}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-xs text-slate-900">
                    {f.totalWorkload} / {f.maxWorkload}h
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
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
                </div>
              </div>

              {/* Course Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {f.courses.length === 0 ? (
                  <span className="text-slate-400 italic text-[11px]">No active course assignments</span>
                ) : (
                  f.courses.map((c) => (
                    <div
                      key={c.courseId}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 flex items-center gap-2 transition-colors"
                    >
                      <span className="font-mono font-bold text-indigo-800 text-[11px]">
                        {c.courseCode}
                      </span>
                      <span className="font-medium text-slate-800">{c.courseName}</span>
                      <span className="text-slate-500 font-bold bg-white px-1.5 py-0.2 rounded text-[10px] border border-slate-200">
                        {c.workloadUnits}h
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900 text-xs">
            <h3 className="text-base font-bold mb-4 pb-2 border-b">Assign Course to Faculty</h3>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="font-semibold block mb-1">Target Faculty</label>
                <select
                  value={selectedFacId}
                  onChange={(e) => setSelectedFacId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  {facultyList.map((f) => (
                    <option key={f.facultyId} value={f.facultyId}>
                      {f.name} ({f.totalWorkload}/{f.maxWorkload}h - {f.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Course to Assign</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode}: {c.courseName} ({c.workloadUnits}h)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900 text-xs">
            <h3 className="text-base font-bold mb-4 pb-2 border-b">Reassign / Transfer Course</h3>
            <form onSubmit={handleReassign} className="space-y-4">
              <div>
                <label className="font-semibold block mb-1">Source Faculty (Relieved)</label>
                <select
                  value={selectedFacId}
                  onChange={(e) => setSelectedFacId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  {facultyList.map((f) => (
                    <option key={f.facultyId} value={f.facultyId}>
                      {f.name} ({f.totalWorkload}h - {f.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Target Faculty (Recipient)</label>
                <select
                  value={targetFacId}
                  onChange={(e) => setTargetFacId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  {facultyList
                    .filter((f) => f.facultyId !== selectedFacId)
                    .map((f) => (
                      <option key={f.facultyId} value={f.facultyId}>
                        {f.name} ({f.totalWorkload}/{f.maxWorkload}h - {f.status})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Course to Transfer</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  {facultyList
                    .find((f) => f.facultyId === selectedFacId)
                    ?.courses.map((c) => (
                      <option key={c.courseId} value={c.courseId}>
                        {c.courseCode}: {c.courseName} ({c.workloadUnits}h)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {submitting ? 'Transferring...' : 'Transfer Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
