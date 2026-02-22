import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  openApp: (url: string): Promise<void> => ipcRenderer.invoke("open-app", url),

  closeApp: (): Promise<void> => ipcRenderer.invoke("close-app"),

  onViewStateChange: (callback: (isOpen: boolean) => void) => {
    ipcRenderer.on("view-state-change", (_event, isOpen) => callback(isOpen));
    return () => ipcRenderer.removeAllListeners("view-state-change");
  },
});
