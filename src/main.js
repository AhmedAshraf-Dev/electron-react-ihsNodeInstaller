// ============================================================
// IHS CLIENT NODE INSTALLER - MAIN PROCESS
// Electron Forge + Vite
// ============================================================

import { app, BrowserWindow, ipcMain, shell, dialog } from "electron";

import path from "node:path";
import fs from "node:fs";

import started from "electron-squirrel-startup";
import { installPackage } from "./renderer/services/package-installer";

const { exec, spawn } = require("child_process");

function getLogDirectory() {
  const logDirectory = path.join(app.getPath("userData"), "logs");

  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, {
      recursive: true,
    });
  }

  return logDirectory;
}

function getInstallLogPath() {
  return path.join(getLogDirectory(), "install-service.log");
}

function logInstall(message, data = null) {
  try {
    const timestamp = new Date().toISOString();

    let line = `[${timestamp}] ${message}`;

    if (data !== null && data !== undefined) {
      if (typeof data === "string") {
        line += `\n${data}`;
      } else {
        line += `\n${JSON.stringify(data, null, 2)}`;
      }
    }

    line += "\n";

    fs.appendFileSync(getInstallLogPath(), line, "utf8");

    // Also keep console output
    console.log(message, data ?? "");
  } catch (error) {
    console.error("Failed to write installation log:", error);
  }
}
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
const { execFile } = require("child_process");

function getPrinterStatus(printerName) {
  return new Promise((resolve, reject) => {
    const psScript = `
      $printer = Get-CimInstance Win32_Printer -Filter "Name='${printerName.replace(/'/g, "''")}'"

      if ($null -eq $printer) {
        Write-Output "NOT_FOUND"
        exit
      }

      Write-Output ("STATUS=" + $printer.PrinterStatus)
      Write-Output ("WORKOFFLINE=" + $printer.WorkOffline)
      Write-Output ("ERRORSTATE=" + $printer.DetectedErrorState)
      Write-Output ("ONLINE=" + $printer.PrinterStatus)
    `;

    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        psScript,
      ],
      {
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }

        resolve(stdout.trim());
      },
    );
  });
}
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
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      resolve({
        code,
        stdout,
        stderr,
      });
    });
  });
}
async function stopWindowsService(serviceName) {
  console.log(`🛑 Stopping service: ${serviceName}`);

  const result = await runCommand("sc.exe", ["stop", serviceName]);

  console.log("Stop service result:", result);

  // Service may already be stopped.
  // Do not fail reinstall because of that.
  return result;
}
async function deleteWindowsService(serviceName) {
  console.log(`🗑️ Deleting service: ${serviceName}`);

  const result = await runCommand("sc.exe", ["delete", serviceName]);

  console.log("Delete service result:", result);

  return result;
}
async function killProcess(processName) {
  console.log(`🛑 Killing process: ${processName}`);

  const result = await runCommand("taskkill.exe", ["/F", "/IM", processName]);

  console.log("Kill process result:", result);

  return result;
}
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

    let stdout = "";
    let stderr = "";

    try {
      // ============================================================
      // VALIDATE CONFIG
      // ============================================================

      if (!config) {
        throw new Error("Installation configuration is required.");
      }

      const installPath = config.installPath?.trim();

      if (!installPath) {
        throw new Error("Install path is required.");
      }

      // ============================================================
      // PROJECT PATH
      // ============================================================

      const projectFolderPath = app.isPackaged
        ? path.join(process.resourcesPath, "printer-project")
        : path.join(app.getAppPath(), "printer-project");

      const batPath = path.join(projectFolderPath, "install-service.bat");

      const sourceWorkerDir = path.join(projectFolderPath, "Worker");

      const sourceTrayDir = path.join(projectFolderPath, "Tray");

      const sourceAppSettingsPath = path.join(
        sourceWorkerDir,
        "appsettings.json",
      );

      console.log("📁 Project:", projectFolderPath);

      console.log("📄 BAT:", batPath);

      console.log("📁 Worker:", sourceWorkerDir);

      console.log("📁 Tray:", sourceTrayDir);

      // ============================================================
      // VERIFY PROJECT
      // ============================================================

      if (!fs.existsSync(projectFolderPath)) {
        throw new Error(
          `Printer project directory not found: ${projectFolderPath}`,
        );
      }

      if (!fs.existsSync(batPath)) {
        throw new Error(`Installation BAT not found: ${batPath}`);
      }

      // ============================================================
      // CREATE SOURCE WORKER DIRECTORY
      // ============================================================

      if (!fs.existsSync(sourceWorkerDir)) {
        fs.mkdirSync(sourceWorkerDir, {
          recursive: true,
        });
      }

      // ============================================================
      // REBUS QUEUE PATH
      // ============================================================

      const rebusQueuesPath = path.join(installPath, "RebusQueues");

      // ============================================================
      // PREPARE APPSETTINGS
      // ============================================================

      const appSettings = {
        ConnectionStrings: {
          MQ_Connection: rebusQueuesPath,
        },

        WebSocket: {
          Uri: "ws://ihs-solutions.com:9000/BrandingMartPOS/ClientNodeShope",

          OrderType: config.OrderType ?? -1,

          NodeID: config.nodeID ?? "",

          Token: config.token ?? "",
        },

        Printing: {
          Printers: {
            saleInvoice: config.printers || [],
          },
        },
      };

      console.log("📝 Preparing appsettings.json...");

      fs.writeFileSync(
        sourceAppSettingsPath,
        JSON.stringify(appSettings, null, 2),
        "utf8",
      );

      console.log(
        "✅ Source appsettings.json prepared:",
        sourceAppSettingsPath,
      );

      // ============================================================
      // INSTALLATION ID
      // ============================================================

      const installId = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;

      const completionFile = path.join(
        installPath,
        `.install-complete-${installId}.txt`,
      );

      console.log("🆔 Installation ID:", installId);

      console.log("📄 Completion file:", completionFile);

      // ============================================================
      // MAKE INSTALL DIRECTORY
      // ============================================================

      if (!fs.existsSync(installPath)) {
        fs.mkdirSync(installPath, {
          recursive: true,
        });
      }

      // ============================================================
      // REMOVE OLD COMPLETION FILE
      // ============================================================

      if (fs.existsSync(completionFile)) {
        fs.unlinkSync(completionFile);
      }

      // ============================================================
      // START BAT IN BACKGROUND
      // ============================================================

      console.log("==========================================");

      console.log("▶️ Starting BAT in background...");

      console.log("==========================================");

      const batProcess = spawn(
        "cmd.exe",
        ["/d", "/c", batPath, projectFolderPath, installPath, installId],
        {
          cwd: projectFolderPath,

          windowsHide: false,

          detached: true,

          stdio: "ignore",
        },
      );

      console.log("✅ BAT started. PID:", batProcess.pid);

      batProcess.unref();

      batProcess.on("error", (error) => {
        console.error("❌ Failed to start BAT:", error);
      });

      // ============================================================
      // WAIT FOR COMPLETION FILE
      // ============================================================

      console.log("⏳ Waiting for installation completion...");

      const timeout = 5 * 60 * 1000;

      const interval = 1000;

      const startTime = Date.now();

      let installationResult = null;

      while (true) {
        // ----------------------------------------------------------
        // CHECK COMPLETION FILE
        // ----------------------------------------------------------

        if (fs.existsSync(completionFile)) {
          installationResult = fs.readFileSync(completionFile, "utf8").trim();

          console.log("📄 Completion file detected:");

          console.log(installationResult);

          break;
        }

        // ----------------------------------------------------------
        // TIMEOUT
        // ----------------------------------------------------------

        if (Date.now() - startTime > timeout) {
          throw new Error(
            "Installation timed out. The BAT did not create the completion file.",
          );
        }

        // ----------------------------------------------------------
        // WAIT
        // ----------------------------------------------------------

        await new Promise((resolve) => setTimeout(resolve, interval));
      }

      // ============================================================
      // PARSE COMPLETION RESULT
      // ============================================================

      const resultLines = installationResult
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const result = {};

      for (const line of resultLines) {
        const separator = line.indexOf("=");

        if (separator === -1) {
          continue;
        }

        const key = line.substring(0, separator).trim();

        const value = line.substring(separator + 1).trim();

        result[key] = value;
      }

      console.log("📦 Parsed installation result:", result);

      // ============================================================
      // CHECK STATUS
      // ============================================================

      if (result.STATUS !== "SUCCESS") {
        throw new Error(resultLines.join("\n") || "Installation failed.");
      }

      // ============================================================
      // VERIFY INSTALLATION RESULT
      // ============================================================

      const workerDir = path.join(installPath, "worker");

      const trayDir = path.join(installPath, "tray");

      const workerExe = path.join(workerDir, "FamousBurgerWorkerService.exe");

      const trayExe = path.join(trayDir, "ClientAdapterTray.exe");

      const installedAppSettingsPath = path.join(workerDir, "appsettings.json");

      // ============================================================
      // VERIFY WORKER
      // ============================================================

      if (!fs.existsSync(workerExe)) {
        throw new Error(
          `Worker EXE not found after installation: ${workerExe}`,
        );
      }

      console.log("✅ Worker EXE verified:", workerExe);

      // ============================================================
      // VERIFY TRAY
      // ============================================================

      if (!fs.existsSync(trayExe)) {
        throw new Error(`Tray EXE not found after installation: ${trayExe}`);
      }

      console.log("✅ Tray EXE verified:", trayExe);

      // ============================================================
      // VERIFY APPSETTINGS
      // ============================================================

      if (!fs.existsSync(installedAppSettingsPath)) {
        throw new Error(
          `Installed appsettings.json not found: ${installedAppSettingsPath}`,
        );
      }

      console.log(
        "✅ Installed appsettings.json verified:",
        installedAppSettingsPath,
      );

      // ============================================================
      // SUCCESS
      // ============================================================

      console.log("==========================================");

      console.log("✅ INSTALLATION COMPLETED SUCCESSFULLY");

      console.log("==========================================");

      return {
        success: true,

        message: "Service installed and configured successfully.",

        installId,

        installPath,

        projectFolderPath,

        batPath,

        workerDir,

        workerExe,

        trayDir,

        trayExe,

        appSettingsPath: installedAppSettingsPath,

        sourceAppSettingsPath,

        rebusQueuesPath,

        completionFile,

        installationResult: result,

        stdout,

        stderr,
      };
    } catch (error) {
      console.error("==========================================");

      console.error("❌ INSTALLATION FAILED");

      console.error("==========================================");

      console.error(error);

      return {
        success: false,

        message: error?.message || "Installation failed.",

        stdout,

        stderr,

        error: error?.message || "Unknown error.",
      };
    }
  });
  ipcMain.handle("reinstall-service", async (_event, config) => {
    console.log("🔄 Reinstalling service...");

    try {
      if (!config) {
        return {
          success: false,
          error: "Installation configuration is required.",
        };
      }

      const installPath = config.installPath?.trim();

      if (!installPath) {
        return {
          success: false,
          error: "Install path is required.",
        };
      }

      // ============================================================
      // STOP OLD SERVICE
      // ============================================================

      console.log("🛑 Stopping old service...");

      await stopWindowsService("FamousBurgerWorkerService");

      // ============================================================
      // REMOVE OLD SERVICE
      // ============================================================

      console.log("🗑️ Removing old service...");

      await deleteWindowsService("FamousBurgerWorkerService");

      // ============================================================
      // REMOVE OLD TRAY PROCESS
      // ============================================================

      console.log("🛑 Stopping old tray...");

      await killProcess("ClientAdapterTray.exe");

      // ============================================================
      // REMOVE OLD INSTALLATION
      // ============================================================

      const workerDir = path.join(installPath, "worker");

      const trayDir = path.join(installPath, "tray");

      console.log("🗑️ Removing old worker:", workerDir);

      if (fs.existsSync(workerDir)) {
        fs.rmSync(workerDir, {
          recursive: true,
          force: true,
        });
      }

      console.log("🗑️ Removing old tray:", trayDir);

      if (fs.existsSync(trayDir)) {
        fs.rmSync(trayDir, {
          recursive: true,
          force: true,
        });
      }

      // ============================================================
      // INSTALL AGAIN
      // ============================================================

      console.log("📦 Starting fresh installation...");

      const result = await installService(config);

      if (!result.success) {
        return {
          success: false,
          message: result.message || "Reinstallation failed.",

          error: result.error || result.message || "Reinstallation failed.",

          installation: result,
        };
      }

      console.log("✅ REINSTALLATION COMPLETED");

      return {
        success: true,

        message: "Service reinstalled successfully.",

        installation: result,
      };
    } catch (error) {
      console.error("❌ REINSTALLATION FAILED:", error);

      return {
        success: false,

        message: error?.message || "Reinstallation failed.",

        error: error?.message || "Unknown error.",
      };
    }
  });

  ipcMain.handle("test-printer", async (event, printerName) => {
    let printWindow = null;

    try {
      if (!printerName) {
        return {
          success: false,
          printed: false,
          error: "No printer was selected.",
        };
      }

      console.log("🖨️ Checking printer:", printerName);

      // Check printer status BEFORE printing
      const status = await getPrinterStatus(printerName);

      console.log("🖨️ Printer status:");
      console.log(status);

      if (!status || status.includes("NOT_FOUND")) {
        return {
          success: false,
          printed: false,
          error: `Printer "${printerName}" was not found.`,
        };
      }

      const workOffline = /WORKOFFLINE=True/i.test(status);

      if (workOffline) {
        return {
          success: false,
          printed: false,
          error: `Printer "${printerName}" is offline or disconnected.`,
        };
      }

      // ---------------------------------------------
      // Create print window
      // ---------------------------------------------

      printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              width: 80mm;
              margin: 0;
              padding: 10px;
              text-align: center;
            }

            .header {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }

            .divider {
              border-top: 1px dashed #000;
              margin: 8px 0;
            }

            .details {
              text-align: left;
              font-size: 10px;
            }
          </style>
        </head>

        <body>
          <div class="header">TEST PRINT</div>
          <div>Printer Working Successfully!</div>

          <div class="divider"></div>

          <div class="details">
            <p>
              <strong>Printer:</strong>
              ${printerName}
            </p>

            <p>
              <strong>Date:</strong>
              ${new Date().toLocaleString()}
            </p>
          </div>

          <div class="divider"></div>

          <div>*** END OF TEST ***</div>
        </body>
      </html>
    `;

      await printWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
      );

      // ---------------------------------------------
      // Print
      // ---------------------------------------------

      const result = await new Promise((resolve) => {
        printWindow.webContents.print(
          {
            silent: true,
            deviceName: printerName,
            printBackground: true,
          },
          (success, failureReason) => {
            resolve({
              success,
              failureReason,
            });
          },
        );
      });

      if (!result.success) {
        return {
          success: false,
          printed: false,
          error: result.failureReason || "Print failed.",
        };
      }

      return {
        success: true,
        printed: true,
        message: `Test print sent successfully to "${printerName}".`,
      };
    } catch (error) {
      console.error("❌ Printer test failed:", error);

      return {
        success: false,
        printed: false,
        error: error.message || "Printer test failed.",
      };
    } finally {
      if (printWindow && !printWindow.isDestroyed()) {
        printWindow.destroy();
      }
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

  mainWindow.setMenu(null);
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
