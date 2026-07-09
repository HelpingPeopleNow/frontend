// Lightweight runtime response-shape validators at adapter boundaries
// (anti-corruption layer). Fail loudly with a descriptive error rather than
// silently corrupting downstream domain state when the backend ships a
// malformed payload.

function type(obj: unknown): string {
  if (obj === undefined) return 'undefined';
  if (obj === null) return 'null';
  if (Array.isArray(obj)) return 'array';
  return typeof obj;
}

function fail(what: string, got: unknown): never {
  const msg = `[anti-corruption] ${what} — got ${type(got)} value: ${JSON.stringify(got ?? String(got)).slice(0, 200)}`;
  console.error(msg);
  throw new Error(msg);
}

export function assertString(obj: unknown, field: string, parent?: string): void {
  if (typeof obj !== 'string') {
    fail(`${parent ? parent + '.' : ''}${field} must be a string`, obj);
  }
}

export function assertOptString(obj: unknown, field: string, parent?: string): void {
  if (obj != null && typeof obj !== 'string') {
    fail(`${parent ? parent + '.' : ''}${field} must be a string or null`, obj);
  }
}

export function assertBool(obj: unknown, field: string, parent?: string): void {
  if (typeof obj !== 'boolean') {
    fail(`${parent ? parent + '.' : ''}${field} must be a boolean`, obj);
  }
}

export function assertNumber(obj: unknown, field: string, parent?: string): void {
  if (typeof obj !== 'number') {
    fail(`${parent ? parent + '.' : ''}${field} must be a number`, obj);
  }
}

export function assertArray(obj: unknown, field: string, parent?: string): unknown[] {
  if (!Array.isArray(obj)) {
    fail(`${parent ? parent + '.' : ''}${field} must be an array`, obj);
  }
  return obj as unknown[];
}

export function assertObject(obj: unknown, field: string, parent?: string): Record<string, unknown> {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    fail(`${parent ? parent + '.' : ''}${field} must be an object`, obj);
  }
  return obj as Record<string, unknown>;
}
