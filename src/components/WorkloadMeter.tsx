import React from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, ArrowDown } from 'lucide-react';

interface WorkloadMeterProps {
  current: number;
  max: number;
  percentage?: number;
  status?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const WorkloadMeter: React.FC<WorkloadMeterProps> = ({
  current,
  max,
  percentage,
  status,
  showLabels = true,
  size = 'md',
}) => {
  const pct = percentage ?? (max > 0 ? Math.round((current / max) * 100) : 0);
  const derivedStatus =
    status ??
    (current > max
      ? 'Overloaded'
      : current >= max - 2
      ? 'Near Limit'
      : current < 12
      ? 'Underload'
      : 'Normal');

  let colorClass = 'bg-emerald-500';
  let textColorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let Icon = CheckCircle2;

  if (derivedStatus === 'Overloaded') {
    colorClass = 'bg-rose-500';
    textColorClass = 'text-rose-700 bg-rose-50 border-rose-200';
    Icon = AlertTriangle;
  } else if (derivedStatus === 'Near Limit') {
    colorClass = 'bg-amber-500';
    textColorClass = 'text-amber-800 bg-amber-50 border-amber-200';
    Icon = AlertCircle;
  } else if (derivedStatus === 'Underload') {
    colorClass = 'bg-sky-500';
    textColorClass = 'text-sky-700 bg-sky-50 border-sky-200';
    Icon = ArrowDown;
  }

  const heightClass = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-2.5';
  const progressWidth = Math.min(100, pct);

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex items-center justify-between text-xs font-medium mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${textColorClass}`}>
              <Icon className="w-3 h-3" />
              {derivedStatus}
            </span>
            <span className="text-slate-500">
              {current} / {max} hrs
            </span>
          </div>
          <span className="font-bold text-slate-700">{pct}%</span>
        </div>
      )}

      {/* Progress Bar Container */}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClass} relative`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${progressWidth}%` }}
        />
        {/* Overload marker beyond 100% */}
        {pct > 100 && (
          <div
            className="absolute top-0 bottom-0 bg-rose-600/30 animate-pulse"
            style={{ left: '100%', width: '100%' }}
          />
        )}
      </div>
    </div>
  );
};
