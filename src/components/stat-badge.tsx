import React from 'react';

type StatBadgeProps = {
  label: string;
  value: string | number;
  color?: string;
};

export const StatBadge: React.FC<StatBadgeProps> = ({ label, value, color = 'bg-zinc-700' }) => (
  <div className={`text-xs px-2 py-1 rounded-md ${color} text-zinc-200 font-mono inline-flex items-center gap-2 mr-2 mb-1`}>
    <span className="opacity-70 uppercase tracking-wider">{label}</span>
    <span className="font-bold text-white">{value}</span>
  </div>
);
