import React, { useState, useEffect } from 'react';
import { User, FacultyWorkloadItem, TimetableSlot, WorkloadRequest } from '../types/index.ts';
import { WorkloadMeter } from '../components/WorkloadMeter.tsx';
import {
  UserCheck,
  BookOpen,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Plus,
  Send,
  Sparkles,
  Bot,
  Info,
  Building,
  GraduationCap,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface FacultyDashboardProps {
  user: User;
  facultyItem?: FacultyWorkloadItem | null;
  onOpenChatbot: () => void;
  onRefresh: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  user,
  facultyItem,
  onOpenChatbot,
  onRefresh,
}) => {
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [requests, setRequests] = useState<WorkloadRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<'Reduction' | 'Course Reassignment'>('Reduction');
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<number>(4);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [tt, reqs] = await Promise.all([
        api.getTimetable(facultyItem?.facultyId),
        api.getRequests(),
      ]);
      setTimetable(tt);
      setRequests(reqs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setStatusMsg({ type: 'error', text: 'Please describe the reason for your request.' });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    try {
      await api.createRequest({
        requestType,
        courseId: selectedCourseId ? Number(selectedCourseId) : null,
        description,
        priority,
      });

      setStatusMsg({ type: 'success', text: 'Workload adjustment request submitted to HOD and Admin queue.' });
      setShowRequestModal(false);
      setDescription('');
      setSelectedCourseId('');
      loadData();
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to submit request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const currentWorkload = facultyItem?.totalWorkload ?? 0;
  const maxWorkload = facultyItem?.maxWorkload ?? 18;
  const overloadHours = facultyItem?.overloadAmount ?? 0;
  const percentage = facultyItem?.workloadPercentage ?? 0;
  const isOverloaded = currentWorkload > maxWorkload;
  const availableHeadroom = Math.max(0, maxWorkload - currentWorkload);

  return (
    <div className="space-y-6">
      {/* Welcome & Overview Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold backdrop-blur-xs">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Faculty Academic Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {facultyItem?.name || user.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {facultyItem?.designation || 'Faculty'} • Department of {facultyItem?.departmentName || 'Computer Science & Engineering'} • Code: {facultyItem?.facultyCode}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Request Workload Reduction</span>
            </button>
            <button
              onClick={onOpenChatbot}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-indigo-200 font-semibold text-xs rounded-xl border border-white/15 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>FacultyAssist Chat</span>
            </button>
          </div>
        </div>
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

      {/* Primary Workload Gauge & Status Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Your Current Academic Workload</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculated dynamically via university weighting (Theory: 1x, Lab: 1.5x, Tutorial: 1x)
            </p>
          </div>

          {/* Visual Indicator Pill */}
          <div className="shrink-0">
            {isOverloaded ? (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                OVERLOADED (+{overloadHours}h over limit)
              </span>
            ) : currentWorkload >= maxWorkload - 2 ? (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                NEAR CAPACITY LIMIT ({currentWorkload}/{maxWorkload}h)
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                NORMAL WORKLOAD ({currentWorkload}/{maxWorkload}h)
              </span>
            )}
          </div>
        </div>

        {/* Big Meter */}
        <div className="pt-6 pb-2">
          <WorkloadMeter
            current={currentWorkload}
            max={maxWorkload}
            percentage={percentage}
            status={facultyItem?.status}
            size="lg"
          />
        </div>

        {/* 4 Stat Boxes under gauge */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 text-[11px] block">Current Load</span>
            <span className="text-lg font-black text-slate-900">{currentWorkload} hrs</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 text-[11px] block">Ceiling Limit</span>
            <span className="text-lg font-black text-slate-900">{maxWorkload} hrs</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 text-[11px] block">Capacity Status</span>
            <span
              className={`text-lg font-black ${
                isOverloaded ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {isOverloaded ? `+${overloadHours}h Over` : `${availableHeadroom}h Available`}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 text-[11px] block">Workload %</span>
            <span className="text-lg font-black text-slate-900">{percentage}%</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Assigned Courses & Pending Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Assigned Courses (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Assigned Subjects ({facultyItem?.courses.length ?? 0})
              </h4>
            </div>
            <span className="text-xs text-slate-500 font-medium">Fall 2026 Semester</span>
          </div>

          <div className="space-y-3">
            {!facultyItem || facultyItem.courses.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No courses currently assigned to your portfolio.
              </div>
            ) : (
              facultyItem.courses.map((c) => (
                <div
                  key={c.courseId}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl transition-colors text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        {c.courseCode}
                      </span>
                      <span className="font-bold text-slate-900">{c.courseName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                      <span>Type: {c.courseType}</span>
                      <span>Lecture: {c.lectureHours}h</span>
                      {c.labHours > 0 && <span>Lab: {c.labHours}h (x1.5 = {c.labHours * 1.5}h)</span>}
                      {c.tutorialHours > 0 && <span>Tut: {c.tutorialHours}h</span>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs block sm:inline-block">
                      {c.workloadUnits} Workload Hours
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Requests & Approvals Status (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Your Workload Requests</h4>
              </div>
              <button
                onClick={() => setShowRequestModal(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {requests.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No active or past reduction requests on record.
                </div>
              ) : (
                requests.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{r.requestType}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-2">{r.description}</p>
                    {r.adminRemarks && (
                      <p className="text-indigo-600 text-[10px] bg-indigo-50/60 p-1 rounded-md mt-1">
                        Coordinator: {r.adminRemarks}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Requests are processed in strict priority order via Max Heap & FIFO queue.
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Timetable Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">Your Academic Class Schedule</h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">Room & Time Allocations</span>
        </div>

        {timetable.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No class schedule entries registered yet for this term.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {timetable.map((slot) => (
              <div
                key={slot.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{slot.day}</span>
                  <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
                <div className="font-semibold text-slate-800">
                  {slot.courseCode}: {slot.courseName}
                </div>
                <div className="text-[11px] text-slate-500">Venue: {slot.room}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 text-slate-900">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold">Submit Workload Adjustment Request</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Request Type</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Reduction">Workload Reduction</option>
                  <option value="Course Reassignment">Course Reassignment to Available Faculty</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Subject / Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select an assigned course (optional)</option>
                  {facultyItem?.courses.map((c) => (
                    <option key={c.courseId} value={c.courseId}>
                      {c.courseCode}: {c.courseName} ({c.workloadUnits}h)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Urgency / Priority Level (1 = Low, 5 = Critical Overload)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriority(lvl)}
                      className={`flex-1 py-1.5 rounded-lg border font-bold text-center transition-all ${
                        priority === lvl
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {lvl} {lvl === 5 ? '🔥' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Detailed Justification / Statement
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain why this reduction or reassignment is required (e.g. current overload of +6h, academic research commitment, accreditation)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
