export {};

declare global {
  interface Window {
    electronAPI: {
      openApp: (url: string) => Promise<void>;
      closeApp: () => Promise<void>;
      onViewStateChange: (callback: (isOpen: boolean) => void) => () => void;
      getAvailableApps: () => Promise<
        { name: string; link: string; category?: string; icon?: string }[]
      >;
    };
  }
}
