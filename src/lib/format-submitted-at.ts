type FormatOptions = {
  relativeWithinHours?: number;
  timeZone?: string;
};

export const formatSubmittedAt = (value: string, options: FormatOptions = {}): string => {
  const submittedAt = new Date(value);
  if (Number.isNaN(submittedAt.getTime())) return value;

  const relativeWithinHours = options.relativeWithinHours ?? 0;
  if (relativeWithinHours > 0) {
    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - submittedAt.getTime());
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 60) {
      const minutes = Math.max(1, diffMinutes);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < relativeWithinHours) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }
  }

  return submittedAt.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: options.timeZone ?? 'UTC',
  });
};
