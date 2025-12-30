/**
 * Simple logger utility for development and production
 * In production, errors can be sent to an error tracking service
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  error: (message: string, error?: unknown): void => {
    if (isDevelopment) {
      console.error(message, error);
    }
    // In production, send to error tracking service (e.g., Sentry)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error);
    // }
  },
  
  warn: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  
  info: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
};

