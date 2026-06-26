import { log, logError } from '../lib/logger';
import { request } from './api';

export interface AdminUpdateResponse {
  ok: boolean;
  rows_affected: number;
}

export function listEntities<T = unknown>(entity: string, limit = 200): Promise<T[]> {
  log('admin', `listing ${entity} limit=${limit}`);
  return request<T[]>(`/api/v1/admin/${entity}?limit=${limit}`);
}

export function getEntity<T = unknown>(entity: string, id: string): Promise<T> {
  log('admin', `getting ${entity}/${id}`);
  return request<T>(`/api/v1/admin/${entity}/${id}`);
}

export function updateEntity(entity: string, id: string, fields: Record<string, unknown>): Promise<AdminUpdateResponse> {
  log('admin', `updating ${entity}/${id}`);
  return request<AdminUpdateResponse>(`/api/v1/admin/${entity}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
}

export function deleteEntity(entity: string, id: string): Promise<AdminUpdateResponse> {
  log('admin', `deleting ${entity}/${id}`);
  return request<AdminUpdateResponse>(`/api/v1/admin/${entity}/${id}`, { method: 'DELETE' });
}
