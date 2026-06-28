import { log, logError } from './logger';

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

export async function fetchPublicProfile(slug: string): Promise<WorkerPublicProfile | null> {
  log('profile', `fetching public profile for slug=${slug}`);
  const res = await fetch(`/api/v1/workers/public/${encodeURIComponent(slug)}`);
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
  return res.json();
}

export async function fetchLatestProfiles(limit = 6): Promise<WorkerPublicProfile[]> {
  log('profile', `fetching latest profiles limit=${limit}`);
  const res = await fetch(`/api/v1/workers/public/latest?limit=${limit}`);
  if (!res.ok) {
    logError('profile', `fetchLatestProfiles failed: ${res.status}`);
    return [];
  }
  return res.json();
}
