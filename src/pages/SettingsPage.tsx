import React, { useState, useEffect } from 'react';
import { WorkloadSettings } from '../types/index.ts';
import { Sliders, Save, RefreshCw, CheckCircle2, Info } from 'lucide-react';
import { api } from '../services/api.ts';

interface SettingsPageProps {
  onRefreshAll: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onRefreshAll }) => {
  const [settings, setSettings] = useState<WorkloadSettings>({
    lectureWeight: 1.0,
    labWeight: 1.5,
    tutorialWeight: 1.0,
    maxNormalThreshold: 18.0,
    warningThreshold: 16.0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkloadSettings();
      setSettings(data);
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.updateWorkloadSettings(settings);
      setMsg({ type: 'success', text: res.message });
      onRefreshAll();
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Workload Calculation & Capacity Policy Configuration
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Define institutional multipliers, laboratory weightings, and regulatory overload thresholds
        </p>
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

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6 text-xs">
        <div className="border-b pb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Academic Workload Unit Multipliers</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Total Workload Formula: <code>(Lecture Hours × W_lec) + (Lab Hours × W_lab) + (Tutorial Hours × W_tut)</code>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="font-bold text-slate-800 block">Lecture Hour Weight</label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="3.0"
              required
              value={settings.lectureWeight}
              onChange={(e) => setSettings({ ...settings, lectureWeight: Number(e.target.value) })}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
            />
            <span className="text-[10px] text-slate-500 block">Standard: 1.0 unit per hour</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="font-bold text-slate-800 block">Laboratory Session Weight</label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="3.0"
              required
              value={settings.labWeight}
              onChange={(e) => setSettings({ ...settings, labWeight: Number(e.target.value) })}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
            />
            <span className="text-[10px] text-slate-500 block">Standard: 1.5 units per hour</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="font-bold text-slate-800 block">Tutorial Session Weight</label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="3.0"
              required
              value={settings.tutorialWeight}
              onChange={(e) => setSettings({ ...settings, tutorialWeight: Number(e.target.value) })}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
            />
            <span className="text-[10px] text-slate-500 block">Standard: 1.0 unit per hour</span>
          </div>
        </div>

        <div className="border-b pb-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900">Overload & Underload Threshold Ceilings</h3>
          <p className="text-[11px] text-slate-500 mt-1">
            Faculty exceeding the normal threshold are categorized as Overloaded.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="font-bold text-slate-800 block">Maximum Normal Workload (hrs)</label>
            <input
              type="number"
              step="1"
              min="10"
              max="30"
              required
              value={settings.maxNormalThreshold}
              onChange={(e) => setSettings({ ...settings, maxNormalThreshold: Number(e.target.value) })}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
            />
            <span className="text-[10px] text-slate-500 block">Standard maximum: 18 hours / week</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="font-bold text-slate-800 block">Near Limit Warning Threshold (hrs)</label>
            <input
              type="number"
              step="1"
              min="10"
              max="28"
              required
              value={settings.warningThreshold}
              onChange={(e) => setSettings({ ...settings, warningThreshold: Number(e.target.value) })}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
            />
            <span className="text-[10px] text-slate-500 block">Standard warning: 16 hours / week</span>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900 text-[11px]">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Saving these rules will immediately trigger an automatic recalculation of workloads for all faculty in the PostgreSQL database, updating status badges and greedy balancer weights.
          </span>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving & Recomputing...' : 'Apply Rules & Recalculate Workloads'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
