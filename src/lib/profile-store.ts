/**
 * TaxBrain — Profile Store (localStorage Manager)
 *
 * CRUD operations for the user profile stored in localStorage.
 * Returns null when no profile exists (triggers onboarding).
 *
 * Framework-agnostic — no React/Astro imports.
 */

import type { UserProfile } from './types';

const STORAGE_KEY = 'taxbrain_profile';
const CURRENT_VERSION = 1;

// ============================================================
// CORE CRUD
// ============================================================

/**
 * Load the user profile from localStorage.
 * Returns null if no profile exists (first visit → show onboarding).
 */
export function loadProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as UserProfile;

    if (parsed.version < CURRENT_VERSION) {
      return migrateProfile(parsed);
    }

    return parsed;
  } catch {
    console.warn('TaxBrain: Failed to load profile from localStorage');
    return null;
  }
}

/**
 * Save the user profile to localStorage.
 */
export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;

  try {
    const toSave: UserProfile = {
      ...profile,
      lastUpdated: new Date().toISOString(),
      version: CURRENT_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('TaxBrain: Failed to save profile', e);
  }
}

/**
 * Check if a profile exists in localStorage.
 */
export function hasProfile(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}

/**
 * Clear the saved profile (returns to onboarding state).
 */
export function clearProfile(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// ============================================================
// IMPORT / EXPORT
// ============================================================

/**
 * Export the current profile as a JSON string.
 */
export function exportProfile(): string | null {
  const profile = loadProfile();
  if (!profile) return null;
  return JSON.stringify(profile, null, 2);
}

/**
 * Import a profile from a JSON string.
 * Returns the imported profile or null if invalid.
 */
export function importProfile(json: string): UserProfile | null {
  try {
    const parsed = JSON.parse(json) as UserProfile;

    if (!parsed.name || !parsed.jobs || !Array.isArray(parsed.jobs)) {
      return null;
    }

    parsed.version = CURRENT_VERSION;
    parsed.lastUpdated = new Date().toISOString();

    saveProfile(parsed);
    return parsed;
  } catch {
    return null;
  }
}

// ============================================================
// ACTION ITEMS PERSISTENCE
// ============================================================

const ACTIONS_KEY = 'taxbrain_actions';

export function loadActionState(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(ACTIONS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function toggleAction(actionId: string): Record<string, boolean> {
  const state = loadActionState();
  state[actionId] = !state[actionId];

  if (typeof window !== 'undefined') {
    localStorage.setItem(ACTIONS_KEY, JSON.stringify(state));
  }

  return state;
}

// ============================================================
// THEME PERSISTENCE
// ============================================================

const THEME_KEY = 'taxbrain_theme';

export function loadTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';

  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light') return 'light';
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function saveTheme(theme: 'dark' | 'light'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
}

// ============================================================
// MIGRATIONS
// ============================================================

function migrateProfile(profile: UserProfile): UserProfile {
  const migrated = { ...profile };
  migrated.version = CURRENT_VERSION;
  saveProfile(migrated);
  return migrated;
}
