export const resolveRegion = (environment: string): string => {
  const normalizedEnvironment = environment?.trim()?.toLowerCase();
  return normalizedEnvironment || 'us1';
};
