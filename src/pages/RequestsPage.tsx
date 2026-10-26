import React, { useState, useEffect } from 'react';
import { WorkloadRequest, User } from '../types/index.ts';
import { Inbox, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldCheck, UserCheck, MessageSquare } from 'lucide-react';
import { api } from '../services/api.ts';

interface RequestsPageProps {
  user: User;
  onRefreshAll: () => void;
}

export const RequestsPage: React.FC<RequestsPageProps> = ({ user, onRefreshAll }) => {
  const [requests, setRequests] = useState<WorkloadRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState<WorkloadRequest | null>(null);
  const [actionType, setActionType] = useState<'Approved' | 'Rejected'>('Approved');
  const [remarks, setRemarks] = useState('');
  const [autoReassign, setAutoReassign] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canApprove = user.role === 'admin' || user.role === 'hod';

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getRequests();
      setRequests(res);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to load requests' });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setSubmitting(true);
    setMsg(null);
    try {
      await api.updateRequestStatus(selectedReq.id, actionType, remarks, autoReassign);
      setMsg({
        type: 'success',
        text: `Request #${selectedReq.id} has been marked as ${actionType}. Workload database updated.`,
      });
      setSelectedReq(null);
      setRemarks('');
      loadRequests();
      onRefreshAll();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update request' });
    } finally {
      setSubmitting(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'Pending');
  const pastRequests = requests.filter((r) => r.status !== 'Pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Workload Adjustment Requests
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            FIFO priority pipeline for faculty workload reduction, subject reassignments, and exemptions
          </p>
        </div>

        <div className="text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          Pending In Queue: {pendingRequests.length} Requests
        </div>
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

      {/* Active Pending FIFO Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Pending Queue (Ordered by Arrival & Urgency)
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">FIFO / Priority Queue</span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No pending requests in the review queue. All faculty petitions are resolved.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {pendingRequests.map((r, idx) => (
              <div
                key={r.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{r.facultyName}</span>
                    <span className="text-[11px] text-slate-500 font-mono">({r.facultyCode})</span>
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {r.requestType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        r.priority >= 4
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Priority Level {r.priority}
                    </span>
                  </div>

                  <p className="text-slate-700 leading-relaxed max-w-3xl">{r.description}</p>

                  <div className="text-[11px] text-slate-400 flex items-center gap-4">
                    <span>Submitted: {new Date(r.createdAt).toLocaleDateString()}</span>
                    {r.courseName && (
                      <span className="text-indigo-600 font-semibold">
                        Subject: {r.courseCode} ({r.courseName})
                      </span>
                    )}
                  </div>
                </div>

                {canApprove && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedReq(r);
                        setActionType('Approved');
                        setRemarks('Approved by academic coordinator. Reassignment applied.');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReq(r);
                        setActionType('Rejected');
                        setRemarks('Request cannot be accommodated at this time due to semester accreditation.');
                      }}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical / Resolved Requests */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
            Resolved Requests Archive ({pastRequests.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] font-semibold">
              <tr>
                <th className="p-3">Faculty</th>
                <th className="p-3">Type</th>
                <th className="p-3">Description</th>
                <th className="p-3">Status</th>
                <th className="p-3">Coordinator Remarks</th>
                <th className="p-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pastRequests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{r.facultyName}</td>
                  <td className="p-3">{r.requestType}</td>
                  <td className="p-3 max-w-xs truncate">{r.description}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 italic">{r.adminRemarks || '—'}</td>
                  <td className="p-3 text-right text-slate-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval / Rejection Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-900 text-xs">
            <h3 className="text-base font-bold mb-2">
              {actionType === 'Approved' ? 'Approve' : 'Reject'} Workload Request #{selectedReq.id}
            </h3>
            <p className="text-slate-600 mb-3">
              Faculty: <strong>{selectedReq.facultyName}</strong> ({selectedReq.facultyCode})
            </p>

            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className="font-semibold block mb-1">Coordinator Remarks / Feedback</label>
                <textarea
                  rows={3}
                  required
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              {actionType === 'Approved' && selectedReq.requestType === 'Course Reassignment' && (
                <label className="flex items-center gap-2 cursor-pointer bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-200">
                  <input
                    type="checkbox"
                    checked={autoReassign}
                    onChange={(e) => setAutoReassign(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="font-semibold text-indigo-950">
                    Automatically apply course reassignment and update faculty workloads in production
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 border rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 text-white rounded-xl font-bold shadow-xs cursor-pointer ${
                    actionType === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Updating...' : `Confirm ${actionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
