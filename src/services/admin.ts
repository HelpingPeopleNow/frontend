import { request } from './api';

export interface AdminUpdateResponse {
  ok: boolean;
  rows_affected: number;
}

export function listEntities<T = unknown>(entity: string, limit = 200): Promise<T[]> {
  return request(`/api/v1/admin/${entity}?limit=${limit}`);
}

export function getEntity<T = unknown>(entity: string, id: string): Promise<T> {
  return request(`/api/v1/admin/${entity}/${id}`);
}

export function updateEntity(entity: string, id: string, fields: Record<string, unknown>): Promise<AdminUpdateResponse> {
  return request(`/api/v1/admin/${entity}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
}

export function deleteEntity(entity: string, id: string): Promise<AdminUpdateResponse> {
  return request(`/api/v1/admin/${entity}/${id}`, { method: 'DELETE' });
}
