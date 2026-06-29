import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

async function importFreshLogger() {
  vi.resetModules();
  return import('../../src/lib/logger');
}

describe('lib/logger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('log()', () => {
    it('does not emit when DEV is false (production)', async () => {
      vi.stubEnv('DEV', false);
      vi.stubEnv('MODE', 'production');
      const { log } = await importFreshLogger();
      log('chat', 'hello');
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('emits with [Chat] prefix when DEV is true', async () => {
      vi.stubEnv('DEV', true);
      vi.stubEnv('MODE', 'development');
      const { log } = await importFreshLogger();
      log('chat', 'hello');
      expect(logSpy).toHaveBeenCalledWith('[Chat]', 'hello');
    });

    it('emits each category prefix', async () => {
      vi.stubEnv('DEV', true);
      vi.stubEnv('MODE', 'development');
      const { log } = await importFreshLogger();
      log('auth', 'login attempt');
      log('dm', 'incoming message');
      log('admin', 'save prompt');
      expect(logSpy).toHaveBeenCalledWith('[Auth]', 'login attempt');
      expect(logSpy).toHaveBeenCalledWith('[DM]', 'incoming message');
      expect(logSpy).toHaveBeenCalledWith('[Admin]', 'save prompt');
    });

    it('forwards multiple arguments', async () => {
      vi.stubEnv('DEV', true);
      vi.stubEnv('MODE', 'development');
      const { log } = await importFreshLogger();
      log('chat', 'msg', { foo: 1 }, [1, 2]);
      expect(logSpy).toHaveBeenCalledWith('[Chat]', 'msg', { foo: 1 }, [1, 2]);
    });
  });

  describe('logError()', () => {
    it('emits with category prefix to console.error regardless of DEV', async () => {
      vi.stubEnv('DEV', false);
      vi.stubEnv('MODE', 'production');
      const { logError } = await importFreshLogger();
      logError('chat', 'boom');
      expect(errSpy).toHaveBeenCalledWith('[Chat]', 'boom');
    });

    it('emits each category prefix', async () => {
      const { logError } = await importFreshLogger();
      logError('auth', 'a');
      logError('admin', 'b');
      logError('dm', 'c');
      logError('api', 'd');
      logError('sse', 'e');
      expect(errSpy).toHaveBeenCalledWith('[Auth]', 'a');
      expect(errSpy).toHaveBeenCalledWith('[Admin]', 'b');
      expect(errSpy).toHaveBeenCalledWith('[DM]', 'c');
      expect(errSpy).toHaveBeenCalledWith('[API]', 'd');
      expect(errSpy).toHaveBeenCalledWith('[SSE]', 'e');
    });

    it('forwards multiple arguments', async () => {
      const { logError } = await importFreshLogger();
      logError('chat', 'err', new Error('nested'), 42);
      expect(errSpy).toHaveBeenCalledWith('[Chat]', 'err', expect.any(Error), 42);
    });
  });

  describe('logWarn()', () => {
    it('emits with category prefix to console.warn regardless of DEV', async () => {
      const { logWarn } = await importFreshLogger();
      logWarn('chat', 'careful');
      expect(warnSpy).toHaveBeenCalledWith('[Chat]', 'careful');
    });

    it('forwards multiple arguments', async () => {
      const { logWarn } = await importFreshLogger();
      logWarn('dm', 'rate limited', { retryAfter: 5 });
      expect(warnSpy).toHaveBeenCalledWith('[DM]', 'rate limited', { retryAfter: 5 });
    });
  });
});