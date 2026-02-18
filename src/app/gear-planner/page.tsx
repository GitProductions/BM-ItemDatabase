"use client";

import { GearPlanner } from '@/components/gear-planner/gear-planner';
import { useAppData } from '@/components/app-provider';
import PageHeader from '@/components/ui/PageHeader';
import { Sparkles } from 'lucide-react';
import { NotebookPen } from 'lucide-react';

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

  return (
    <div className="max-w-7xl mx-auto px-4 ">

      <PageHeader
        title="Gear Planner"
        description="Build and compare equipment loadouts with stat calculations"
        icons={<NotebookPen className="text-orange-400" size={24} />}
      />

      <GearPlanner items={items} />
    </div>
  );
}
