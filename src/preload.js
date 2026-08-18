import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("setupAPI", {
  // ========================================================
  // PORTAL
  // ========================================================

  getPortalUrl: () => ipcRenderer.invoke("get-portal-url"),

  getSetupResponse: () => ipcRenderer.invoke("get-setup-response"),

  setupComplete: (data) => ipcRenderer.invoke("setup-complete", data),

  resetSetup: () => ipcRenderer.invoke("reset-setup"),

  // ========================================================
  // PRINTER
  // ========================================================

  getPrinters: () => ipcRenderer.invoke("get-printers"),

  // ========================================================
  // DIRECTORY
  // ========================================================
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  getDiskSpace: (targetPath) =>
    ipcRenderer.invoke("get-disk-space", targetPath),

  // ========================================================
  // LOGO
  // ========================================================

  selectLogo: () => ipcRenderer.invoke("select-logo"),

  // ========================================================
  // SERVICE
  // ========================================================

  installService: (config) => ipcRenderer.invoke("install-service", config),
  reinstallService: (config) => ipcRenderer.invoke("reinstall-service", config),
  testPrinter: (printerName) => ipcRenderer.invoke("test-printer", printerName),
  getServiceStatus: () => ipcRenderer.invoke("get-service-status"),

  uninstallService: () => ipcRenderer.invoke("uninstall-service"),

  // ========================================================
  // EXTERNAL
  // ========================================================

  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  // ========================================================
  // MESSAGE
  // ========================================================

  showMessageBox: (options) => ipcRenderer.invoke("show-message-box", options),

  installPackage: (config) => ipcRenderer.invoke("install-package", config),
});
