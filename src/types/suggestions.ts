export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface Suggestion {
  id: string;
  itemId: string;
  proposer?: string;
  note: string;
  reason?: string;
  status?: SuggestionStatus;
  createdAt?: string;
}
