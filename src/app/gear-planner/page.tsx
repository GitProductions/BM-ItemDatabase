"use client";

import { GearPlanner } from '@/components/gear-planner/gear-planner';
import { useAppData } from '@/components/app-provider';

export default function GearPlannerPage() {
  const { items, loading, error } = useAppData();

  if (loading) {
    return <div className="text-center py-20 text-zinc-500">Loading items for planner...</div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-800/60 bg-rose-900/20 px-4 py-3 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  return <GearPlanner items={items} />;
}
