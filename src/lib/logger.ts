const PREFIXES = {
  chat: '[Chat]',
  auth: '[Auth]',
  admin: '[Admin]',
  dm: '[DM]',
  nav: '[Nav]',
  mode: '[ModeChooser]',
  api: '[API]',
  sse: '[SSE]',
  inbox: '[Inbox]',
  thread: '[Thread]',
  speech: '[Speech]',
  app: '[App]',
  profile: '[Profile]',
  landing: '[Landing]',
  feedback: '[Feedback]',
  geo: '[Geo]',
} as const;

type LoggerCategory = keyof typeof PREFIXES;

export function log(category: LoggerCategory, ...args: unknown[]) {
  if (import.meta.env.DEV) {
    console.log(PREFIXES[category], ...args);
  }
}

export function logError(category: LoggerCategory, ...args: unknown[]) {
  console.error(PREFIXES[category], ...args);
}

export function logWarn(category: LoggerCategory, ...args: unknown[]) {
  console.warn(PREFIXES[category], ...args);
}
