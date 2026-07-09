import { log, logError } from './logger';
import { assertString, assertBool, assertNumber, assertArray, assertObject } from './validate';

const DEFAULT_TIMEOUT_MS = 15000;

// ── Types ────────────────────────────────────────────────────────────────────

export interface WorkerPublicProfile {
  id: string;
  slug: string;
  profession: string;
  business_name: string;
  bio: string;
  city: string;
  service_radius_km: number;
  hourly_rate: number;
  minimum_charge: number;
  free_estimate: boolean;
  years_experience: number;
  certifications: string[];
  has_insurance: boolean;
  languages: string[];
  emergency_service: boolean;
  website: string;
  social_links: SocialLink[];
  created_at: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

// ── API Functions ────────────────────────────────────────────────────────────

function parseWorkerPublicProfile(raw: unknown): WorkerPublicProfile {
  const o = assertObject(raw, 'WorkerPublicProfile');
  assertString(o.id, 'id', 'WorkerPublicProfile');
  assertString(o.slug, 'slug', 'WorkerPublicProfile');
  assertString(o.profession, 'profession', 'WorkerPublicProfile');
  assertString(o.business_name, 'business_name', 'WorkerPublicProfile');
  assertString(o.bio, 'bio', 'WorkerPublicProfile');
  assertString(o.city, 'city', 'WorkerPublicProfile');
  assertNumber(o.service_radius_km, 'service_radius_km', 'WorkerPublicProfile');
  assertNumber(o.hourly_rate, 'hourly_rate', 'WorkerPublicProfile');
  assertNumber(o.minimum_charge, 'minimum_charge', 'WorkerPublicProfile');
  assertBool(o.free_estimate, 'free_estimate', 'WorkerPublicProfile');
  assertNumber(o.years_experience, 'years_experience', 'WorkerPublicProfile');
  assertArray(o.certifications, 'certifications', 'WorkerPublicProfile');
  assertBool(o.has_insurance, 'has_insurance', 'WorkerPublicProfile');
  assertArray(o.languages, 'languages', 'WorkerPublicProfile');
  assertBool(o.emergency_service, 'emergency_service', 'WorkerPublicProfile');
  assertString(o.website, 'website', 'WorkerPublicProfile');
  assertArray(o.social_links, 'social_links', 'WorkerPublicProfile');
  assertString(o.created_at, 'created_at', 'WorkerPublicProfile');
  return o as unknown as WorkerPublicProfile;
}

export async function fetchPublicProfile(slug: string): Promise<WorkerPublicProfile | null> {
  log('profile', `fetching public profile for slug=${slug}`);
  const res = await fetch(`/api/v1/workers/public/${encodeURIComponent(slug)}`, {
    credentials: 'include',
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  if (res.status === 404) {
    log('profile', `profile not found for slug=${slug}`);
    return null;
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const errMsg = errBody.error || `Failed to fetch profile (${res.status})`;
    logError('profile', errMsg);
    throw new Error(errMsg);
  }
  const raw = await res.json();
  return parseWorkerPublicProfile(raw);
}

export async function fetchLatestProfiles(limit = 6): Promise<WorkerPublicProfile[]> {
  log('profile', `fetching latest profiles limit=${limit}`);
  const res = await fetch(`/api/v1/workers/public/latest?limit=${limit}`, {
    credentials: 'include',
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });
  if (!res.ok) {
    logError('profile', `fetchLatestProfiles failed: ${res.status}`);
    return [];
  }
  return res.json().then((raw: unknown) => {
    if (!Array.isArray(raw)) return [];
    return raw.map(parseWorkerPublicProfile);
  });
}
