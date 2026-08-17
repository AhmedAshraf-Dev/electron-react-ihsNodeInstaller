// ============================================================
// IHS CLIENT NODE INSTALLER - MAIN PROCESS
// Electron Forge + Vite
// ============================================================

import { app, BrowserWindow, ipcMain, shell, dialog } from "electron";

import path from "node:path";
import fs from "node:fs";

import started from "electron-squirrel-startup";
import { installPackage } from "./renderer/services/package-installer";

// ============================================================
// WINDOWS INSTALLER / SQUIRREL
// ============================================================

if (started) {
  app.quit();
}

// ============================================================
// GLOBALS
// ============================================================

let mainWindow;

// ============================================================
// CONFIGURATION
// ============================================================

const PORTAL_URL = "http://localhost:3000/postForm";
// ============================================================
// SETUP STORAGE
// ============================================================

function getSetupFilePath() {
  return path.join(app.getPath("userData"), "setup-response.json");
}
function getPackagePath() {
  const zipPath = path.join(__dirname, "../src/assets/printer project.rar");

  if (!fs.existsSync(zipPath)) {
    throw new Error(`Client ZIP not found: ${zipPath}`);
  }

  return zipPath;
}
function saveSetupResponse(data) {
  const filePath = getSetupFilePath();

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

  return filePath;
}

function loadSetupResponse() {
  const filePath = getSetupFilePath();

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, "utf8");

  return JSON.parse(content);
}

function clearSetupResponse() {
  const filePath = getSetupFilePath();

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
// ============================================================
// ICON
// ============================================================

function getIconPath() {
  const paths = [
    path.join(__dirname, "../../assets/icons/icon.ico"),
    path.join(__dirname, "../../assets/icon.ico"),
    path.join(__dirname, "../assets/icons/icon.ico"),
  ];

  for (const iconPath of paths) {
    if (fs.existsSync(iconPath)) {
      return iconPath;
    }
  }

  return undefined;
}

// ============================================================
// IPC HANDLERS
// ============================================================

function registerHandlers() {
  // ----------------------------------------------------------
  // PORTAL
  // ----------------------------------------------------------

  ipcMain.handle("get-portal-url", async () => {
    console.log("🌐 Getting portal URL");

    return PORTAL_URL;
  });

  // ----------------------------------------------------------
  // SETUP
  // ----------------------------------------------------------

  ipcMain.handle("setup-complete", async (_event, data) => {
    try {
      const filePath = saveSetupResponse(data);

      console.log("📦 Setup response saved:", filePath);

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ Failed to save setup response:", error);

      return {
        success: false,
        error: error?.message || "Failed to save setup response",
      };
    }
  });

  ipcMain.handle("get-setup-response", async () => {
    try {
      const data = loadSetupResponse();

      console.log("📦 Loaded setup response:", data);

      return data;
    } catch (error) {
      console.error("❌ Failed to load setup response:", error);

      return null;
    }
  });

  ipcMain.handle("reset-setup", async () => {
    try {
      clearSetupResponse();

      console.log("🗑️ Setup response cleared");

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ Failed to reset setup:", error);

      return {
        success: false,
        error: error?.message || "Failed to reset setup",
      };
    }
  });

  // ----------------------------------------------------------
  // SERVICE
  // ----------------------------------------------------------

  ipcMain.handle("install-service", async (_event, config) => {
    console.log("⚙️ Installing service:", config);

    // TODO:
    // Put your actual Windows service installation here.

    return {
      success: true,
      message: "Service installed",
    };
  });

  ipcMain.handle("test-printer", async (event, printerName) => {
    try {
      if (!printerName) {
        return {
          success: false,
          error: "No printer was selected.",
        };
      }

      console.log("🖨️ Testing printer:", printerName);

      // Check that Windows knows about the printer
      const { execFile } = require("child_process");

      const result = await new Promise((resolve, reject) => {
        execFile(
          "powershell.exe",
          [
            "-NoProfile",
            "-Command",
            `
            $printer = Get-Printer -Name '${printerName.replace(/'/g, "''")}' -ErrorAction Stop

            Write-Output "Name: $($printer.Name)"
            Write-Output "Status: $($printer.PrinterStatus)"
            Write-Output "State: $($printer.PrinterState)"
          `,
          ],
          (error, stdout, stderr) => {
            if (error) {
              reject(new Error(stderr || error.message));
              return;
            }

            resolve(stdout);
          },
        );
      });

      console.log("🖨️ Printer information:");
      console.log(result);

      return {
        success: true,
        message: `Printer "${printerName}" is available.`,
      };
    } catch (error) {
      console.error("❌ Printer test failed:", error);

      return {
        success: false,
        error: error.message || "Printer test failed.",
      };
    }
  });

  ipcMain.handle("get-disk-space", async (event, targetPath) => {
    try {
      if (!targetPath) {
        return {
          success: false,
          error: "Installation path is required.",
        };
      }

      let checkPath = targetPath;

      // If the selected directory doesn't exist yet,
      // find the nearest existing parent directory.
      while (!fs.existsSync(checkPath)) {
        const parent = path.dirname(checkPath);

        if (parent === checkPath) {
          break;
        }

        checkPath = parent;
      }

      const stats = fs.statfsSync(checkPath);

      const freeBytes = stats.bavail * stats.bsize;

      return {
        success: true,
        path: targetPath,
        checkedPath: checkPath,
        freeBytes,
        freeMB: Math.floor(freeBytes / 1024 / 1024),
        freeGB: (freeBytes / 1024 / 1024 / 1024).toFixed(2),
      };
    } catch (error) {
      console.error("❌ Failed to check disk space:", error);

      return {
        success: false,
        error: error?.message || "Failed to check available disk space.",
      };
    }
  });

  // ----------------------------------------------------------
  // PACKAGE INSTALLATION
  // ----------------------------------------------------------
  ipcMain.handle("install-package", async (_event, { installPath }) => {
    const zipPath = getPackagePath();

    return installPackage({
      zipPath,
      installPath,
    });
  });

  ipcMain.handle("get-service-status", async () => {
    // TODO:
    // Replace with your actual service status check.

    return {
      installed: true,
      isRunning: true,
    };
  });

  ipcMain.handle("uninstall-service", async () => {
    // TODO:
    // Put your actual Windows service uninstall logic here.

    return {
      success: true,
    };
  });

  // ----------------------------------------------------------
  // EXTERNAL URL
  // ----------------------------------------------------------

  ipcMain.handle("open-external", async (_event, url) => {
    if (!url) {
      return {
        success: false,
        message: "URL is required",
      };
    }

    try {
      await shell.openExternal(url);

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ Failed to open external URL:", error);

      return {
        success: false,
        message: error.message,
      };
    }
  });

  // ----------------------------------------------------------
  // MESSAGE BOX
  // ----------------------------------------------------------

  ipcMain.handle("show-message-box", async (_event, options) => {
    return dialog.showMessageBox(mainWindow, options);
  });

  console.log("✅ IPC handlers registered");
}

// ============================================================
// CREATE WINDOW
// ============================================================

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,

    minWidth: 900,
    minHeight: 600,

    show: false,

    icon: getIconPath(),

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),

      // IMPORTANT:
      // Renderer cannot directly access Node/Electron APIs.
      // Communication goes through preload.js.
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // ----------------------------------------------------------
  // DEVELOPMENT
  // ----------------------------------------------------------

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  }

  // ----------------------------------------------------------
  // PRODUCTION
  // ----------------------------------------------------------
  else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // ----------------------------------------------------------
  // SHOW WINDOW
  // ----------------------------------------------------------

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // ----------------------------------------------------------
  // DEVTOOLS
  // ----------------------------------------------------------

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // ----------------------------------------------------------
  // WINDOW CLOSED
  // ----------------------------------------------------------

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  console.log("✅ Window created");
};

// ============================================================
// PRINTER
// ============================================================

ipcMain.handle("get-printers", async () => {
  if (!mainWindow) {
    return [];
  }

  try {
    const printers = await mainWindow.webContents.getPrintersAsync();

    return printers.map((printer) => ({
      name: printer.name,
      displayName: printer.displayName || printer.name,
      description: printer.description || "",
      status: printer.status,
      isDefault: printer.isDefault,
      options: printer.options || {},
    }));
  } catch (error) {
    console.error("Failed to get printers:", error);

    return [];
  }
});

// ============================================================
// SELECT DIRECTORY
// ============================================================

ipcMain.handle("select-directory", async () => {
  if (!mainWindow) {
    return {
      canceled: true,
      path: null,
    };
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Installation Location",
    properties: ["openDirectory"],
  });

  return {
    canceled: result.canceled,
    path:
      result.canceled || !result.filePaths.length ? null : result.filePaths[0],
  };
});

// ============================================================
// SELECT LOGO
// ============================================================

ipcMain.handle("select-logo", async () => {
  if (!mainWindow) {
    return {
      canceled: true,
      path: null,
    };
  }

  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Select Printer Logo",
    properties: ["openFile"],
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "svg", "webp", "ico"],
      },
    ],
  });

  return {
    canceled: result.canceled,
    path:
      result.canceled || !result.filePaths.length ? null : result.filePaths[0],
  };
});
// ============================================================
// APPLICATION LIFECYCLE
// ============================================================

app.whenReady().then(() => {
  console.log("🚀 App ready");

  // IMPORTANT:
  // Register IPC BEFORE creating the renderer window.
  // This guarantees that renderer IPC calls such as
  // get-portal-url have a handler available.
  registerHandlers();

  createWindow();

  // macOS
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  console.log("✅ Application started");
});

// ============================================================
// ALL WINDOWS CLOSED
// ============================================================

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
