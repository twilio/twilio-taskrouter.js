const ENVIRONMENT_TO_REGION_MAP: Record<string, string> = {
  stage: 'stage-us1',
  'stage-au1': 'stage-au1',
  'stage-ie1': 'stage-ie1',
};

export const resolveRegion = (environment: string): string => {
  const normalizedEnvironment = environment?.trim()?.toLowerCase();
  return ENVIRONMENT_TO_REGION_MAP[normalizedEnvironment] || normalizedEnvironment || 'us1';
};