// Factory helpers for DM-related tests.

export function makeDMMessage(overrides: Partial<{
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  body: string;
  created_at: string;
  read_at: string | null;
}> = {}) {
  return {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-1',
    sender_role: 'client',
    body: 'hello',
    created_at: '2026-01-01T00:00:00Z',
    read_at: null,
    ...overrides,
  };
}

export function makeDMConversationItem(overrides: Partial<{
  id: string;
  unread_count: number;
  status: string;
  last_message: { preview: string; at: string };
}> = {}) {
  return {
    id: 'conv-1',
    other_party: { id: 'w-1', name: 'PlumbCo', role: 'worker' },
    unread_count: 0,
    status: 'active',
    ...overrides,
  };
}

export function makeWorkerPublicProfile(overrides: Partial<{
  id: string;
  slug: string;
  profession: string;
  business_name: string;
}> = {}) {
  return {
    id: 'w-1',
    slug: 'plumbco',
    profession: 'Plumber',
    business_name: 'PlumbCo',
    bio: '',
    city: 'Madrid',
    service_radius_km: 10,
    hourly_rate: 50,
    minimum_charge: 80,
    free_estimate: true,
    years_experience: 8,
    certifications: [],
    has_insurance: true,
    languages: ['es'],
    emergency_service: false,
    website: '',
    social_links: [],
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}