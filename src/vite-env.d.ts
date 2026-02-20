/// <reference types="vite/client" />

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string> }
    ) => void;
    fbq?: (action: string, event: string, data?: Record<string, unknown>) => void;
  }
}

export {};
