function parseDemoFlag(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return null;
}

export function isDemoModeEnabled() {
  const explicitFlag = parseDemoFlag(import.meta.env.VITE_DEMO_MODE);

  if (explicitFlag !== null) {
    return explicitFlag;
  }

  return true;
}
