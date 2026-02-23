import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  WebContentsView,
} from "electron";
import path from "path";
import fs from "fs";
import { isDev } from "./util.js";

// ─── Config ───────────────────────────────────────────────────────────────────
const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/124.0.0.0 Safari/537.36";

// ─── State ────────────────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null;
let activeView: WebContentsView | null = null;

// ─── Main window ─────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: !isDev(),
    backgroundColor: "#050A14",
    frame: isDev(),
    webPreferences: {
      preload: path.join(app.getAppPath(), "dist-electron/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  if (isDev()) {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─── App view ───────────────────────────────────────────────────────────────
function openAppView(url: string) {
  if (!mainWindow) return;
  if (activeView) closeAppView();

  const { width, height } = mainWindow.getBounds();

  activeView = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      autoplayPolicy: "no-user-gesture-required",
    },
  });

  mainWindow.contentView.addChildView(activeView);
  activeView.setBounds({ x: 0, y: 0, width, height });
  activeView.webContents.setUserAgent(CHROME_UA);
  activeView.webContents.loadURL(url);

  mainWindow.on("resize", handleResize);

  mainWindow.webContents.send("view-state-change", true);
}

function closeAppView() {
  if (!activeView || !mainWindow) return;

  mainWindow.removeListener("resize", handleResize);
  mainWindow.contentView.removeChildView(activeView);
  activeView.webContents.close();
  activeView = null;

  // Small delay to flush pending key events before re-enabling keyboard nav
  setTimeout(() => {
    if (mainWindow) {
      mainWindow.webContents.send("view-state-change", false);
      mainWindow.webContents.focus();
    }
  }, 150);
}

function handleResize() {
  if (!activeView || !mainWindow) return;
  const { width, height } = mainWindow.getBounds();
  activeView.setBounds({ x: 0, y: 0, width, height });
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────
ipcMain.handle("open-app", (_event, url) => {
  openAppView(url);
});

ipcMain.handle("close-app", () => {
  closeAppView();
});

ipcMain.handle("get-available-apps", () => {
  const appsPath = isDev()
    ? path.join(process.cwd(), "public/apps.json")
    : path.join(app.getAppPath(), "dist-react/apps.json");

  const iconsBase = isDev()
    ? "http://localhost:3000"
    : `file://${path.join(app.getAppPath(), "dist-react")}`;

  try {
    const raw = fs.readFileSync(appsPath, "utf-8");
    const apps = JSON.parse(raw);

    return apps.map((a: { icon?: string; [key: string]: unknown }) => {
      if (!a.icon) return a;
      const rel = a.icon.replace(/^\.\//, "");
      return { ...a, icon: `${iconsBase}/${rel}` };
    });
  } catch {
    return [];
  }
});

// ─── Lifecycle ────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  globalShortcut.register("Escape", () => {
    if (activeView) closeAppView();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
