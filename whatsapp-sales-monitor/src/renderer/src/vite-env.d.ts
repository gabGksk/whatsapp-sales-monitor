/// <reference types="vite/client" />

declare global {
  interface Window {
    appBridge: { appName: string };
  }
}

export {};
