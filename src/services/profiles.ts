import { request } from './api';

// ── Worker Profile ─────────────────────────────────────────────────────

export interface WorkerProfileDTO {
  id: string;
  user_id: string;
  profession: string;
  business_name: string;
  bio: string;
  phone: string;
  city: string;
  service_radius_km: number;
  address: string;
  hourly_rate: number;
  minimum_charge: number;
  free_estimate: boolean;
  years_experience: number;
  certifications: string[];
  has_insurance: boolean;
  languages: string[];
  emergency_service: boolean;
  website: string;
  social_links: { platform: string; url: string }[];
  created_at: string;
  updated_at: string;
}

export function getWorkerProfile(): Promise<WorkerProfileDTO | { user_id: string }> {
  return request('/api/v1/worker/profile');
}

export function deleteWorkerProfile(): Promise<void> {
  return request('/api/v1/worker/profile', { method: 'DELETE' });
}

// ── Client Profile ──────────────────────────────────────────────────────

export interface ClientProfileDTO {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  city: string;
  address: string;
  bio: string;
  preferred_contact: string;
  property_type: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function getClientProfile(): Promise<ClientProfileDTO | { user_id: string }> {
  return request('/api/v1/client/profile');
}

export function deleteClientProfile(): Promise<void> {
  return request('/api/v1/client/profile', { method: 'DELETE' });
}
