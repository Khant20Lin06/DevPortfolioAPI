const SCHEDULE_MINUTES = [1, 5, 30, 120, 720];

export const nextRetryDate = (attemptNumber) => {
  const minutes = SCHEDULE_MINUTES[Math.min(SCHEDULE_MINUTES.length - 1, Math.max(0, attemptNumber - 1))];
  return new Date(Date.now() + minutes * 60 * 1000);
};