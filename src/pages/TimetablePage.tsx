import React, { useState, useEffect } from 'react';
import { TimetableSlot, FacultyWorkloadItem, Course, User } from '../types/index.ts';
import { Calendar, Plus, Clock, MapPin, Trash2 } from 'lucide-react';
import { api } from '../services/api.ts';

interface TimetablePageProps {
  user: User;
  facultyList: FacultyWorkloadItem[];
  courses: Course[];
  canEdit: boolean;
}

export const TimetablePage: React.FC<TimetablePageProps> = ({
  user,
  facultyList,
  courses,
  canEdit,
}) => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [formFacId, setFormFacId] = useState<number>(facultyList[0]?.facultyId || 1);
  const [formCourseId, setFormCourseId] = useState<number>(courses[0]?.id || 1);
  const [formDay, setFormDay] = useState('Monday');
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('11:00');
  const [formRoom, setFormRoom] = useState('CS-LT101');
  const [submitting, setSubmitting] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    loadTimetable();
  }, [user]);

  const loadTimetable = async () => {
    try {
      const data = await api.getTimetable(user.role === 'faculty' ? user.facultyId || undefined : undefined);
      setSlots(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createTimetableSlot({
        facultyId: Number(formFacId),
        courseId: Number(formCourseId),
        day: formDay,
        startTime: formStart,
        endTime: formEnd,
        room: formRoom,
      });
      setShowAddModal(false);
      loadTimetable();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: number) => {
    try {
      await api.deleteTimetableSlot(id);
      loadTimetable();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredSlots = slots.filter((s) =>
    selectedFacultyId === 'all' ? true : s.facultyId === selectedFacultyId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Academic Schedule & Class Timetable
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Weekly room allocations, laboratory schedules, and lecture time slots
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user.role !== 'faculty' && (
            <select
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="text-xs p-2 bg-white border border-slate-200 rounded-xl"
            >
              <option value="all">All Faculty Schedules</option>
              {facultyList.map((f) => (
                <option key={f.facultyId} value={f.facultyId}>
                  {f.name} ({f.facultyCode})
                </option>
              ))}
            </select>
          )}

          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Timetable Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid by Days of Week */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {daysOfWeek.map((day) => {
          const daySlots = filteredSlots.filter((s) => s.day === day);
          return (
            <div key={day} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-center font-bold text-xs text-slate-900">
                {day}
              </div>

              <div className="p-3 space-y-2.5 flex-1 min-h-[220px]">
                {daySlots.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[11px] text-slate-400 italic">
                    No classes
                  </div>
                ) : (
                  daySlots.map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-xl text-xs space-y-1 relative group"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
                        <span>{s.startTime} - {s.endTime}</span>
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteSlot(s.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity"
                            title="Delete slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 leading-tight">
                        {s.courseCode}: {s.courseName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Instructor: {s.facultyName}
                      </div>
                      <div className="text-[10px] text-indigo-700 flex items-center gap-1 font-semibold">
                        <MapPin className="w-3 h-3" />
                        <span>Room {s.room}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900 text-xs">
            <h3 className="text-base font-bold mb-4 pb-2 border-b">Add Class Timetable Slot</h3>
            <form onSubmit={handleAddSlot} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Faculty Member</label>
                <select
                  value={formFacId}
                  onChange={(e) => setFormFacId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  {facultyList.map((f) => (
                    <option key={f.facultyId} value={f.facultyId}>
                      {f.name} ({f.departmentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Course</label>
                <select
                  value={formCourseId}
                  onChange={(e) => setFormCourseId(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode}: {c.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Day of Week</label>
                <select
                  value={formDay}
                  onChange={(e) => setFormDay(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                >
                  {daysOfWeek.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">End Time</label>
                  <input
                    type="time"
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Classroom / Laboratory</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-LT101 or GPU-Cluster"
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  {submitting ? 'Adding...' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
