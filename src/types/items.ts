export type AffectType = 'spell' | 'stat';

export interface ItemAffect {
  type: AffectType;
  stat?: string;
  value?: number;
  spell?: string;
  level?: number;
  min?: number;
  max?: number;
}

export interface ItemStats {
  affects: ItemAffect[];
  damage?: string;
  ac?: number;
  acMin?: number;
  acMax?: number;
  weight?: number;
  weightMin?: number;
  weightMax?: number;
  condition?: string;
}

export interface Item {
  id: string;
  name: string;
  keywords: string;
  type: string;
  flags: string[];
  submittedBy?: string;
  droppedBy?: string;
  worn?: string[];
  stats: ItemStats;
  ego?: string;
  isArtifact?: boolean;
  raw?: string[];
  flaggedForReview?: boolean;
  duplicateOf?: string; // id of the duplicate item
  submissionCount?: number; // total submissions recorded
  contributors?: string[]; // distinct submitter names
}
