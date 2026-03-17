/// <reference types="vite/client" />

interface Window {
  loaderAPI: {
    minimize: () => Promise<void>;
    close: () => Promise<void>;
    togglePin: () => Promise<boolean>;
    openExternal: (url: string) => Promise<void>;
    startLaunch: (payload: {
      apiUrl: string;
      token: string;
      username: string;
      ramGb: number;
      javaPath?: string;
      version: 'stable' | 'beta';
    }) => Promise<{ ok: boolean }>;
    onLaunchStatus: (callback: (data: { stage: string; details: string; at: number }) => void) => () => void;
  };
}
