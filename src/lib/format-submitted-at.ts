type FormatOptions = {
  relativeWithinHours?: number;
  timeZone?: string;
  dateOnly?: boolean;
};

export const formatSubmittedAt = (value: string, options: FormatOptions = {}): string => {
  const submittedAt = new Date(value);
  if (Number.isNaN(submittedAt.getTime())) return value;

  const now = new Date();
  const diffMs = now.getTime() - submittedAt.getTime();

  if (diffMs >= 0) {
    const diffMinutes = Math.floor(diffMs / 60000);

    // Show relative time within specified hours (default 24)
    const relativeWithinMinutes = (options.relativeWithinHours ?? 24) * 60;

    if (diffMinutes < relativeWithinMinutes) {
      if (diffMinutes < 60) {
        const minutes = Math.max(1, diffMinutes);
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
      }

      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }
  }

  // For old dates, show date only by default
  return submittedAt.toLocaleString('en-US', {
    dateStyle: 'medium',
    ...(options.dateOnly === false ? { timeStyle: 'short' } : {}),
    timeZone: options.timeZone ?? 'UTC',
  });
};
