import path from "node:path";
import fs from "node:fs";
import { execFile } from "node:child_process";

ipcMain.handle("install-service", async (_event, config) => {
  console.log("⚙️ Installing service:", config);

  try {
    // ============================================================
    // PROJECT / BAT PATH
    // ============================================================

    const projectFolderPath = path.join(
      app.getAppPath(),
      "printer-project"
    );

    const batPath = path.join(
      projectFolderPath,
      "install-service.bat"
    );

    console.log("📁 Project folder:", projectFolderPath);
    console.log("📄 BAT path:", batPath);

    if (!fs.existsSync(batPath)) {
      throw new Error(
        `Installation BAT not found: ${batPath}`
      );
    }

    // ============================================================
    // INSTALL PATH
    // ============================================================

    const installPath = config.installPath;

    if (!installPath) {
      throw new Error("Install path is required.");
    }

    // ============================================================
    // WORKER PATH
    // ============================================================

    const workerDir = path.join(
      installPath,
      "worker"
    );

    const appSettingsPath = path.join(
      workerDir,
      "appsettings.json"
    );

    // ============================================================
    // REBUS QUEUE PATH
    // ============================================================

    const rebusQueuesPath = path.join(
      installPath,
      "RebusQueues"
    );

    // ============================================================
    // RUN INSTALLER BAT
    // ============================================================

    console.log("▶️ Running installer...");
    console.log("Install path:", installPath);

    const { stdout, stderr } = await new Promise(
      (resolve, reject) => {
        execFile(
          batPath,
          [
            projectFolderPath,
            installPath,
          ],
          {
            shell: true,
            windowsHide: false,
            maxBuffer: 10 * 1024 * 1024,
          },
          (error, stdout, stderr) => {
            if (error) {
              reject({
                error,
                stdout,
                stderr,
              });

              return;
            }

            resolve({
              stdout,
              stderr,
            });
          }
        );
      }
    );

    console.log("✅ Installer completed");
    console.log(stdout);

    // ============================================================
    // VERIFY WORKER DIRECTORY
    // ============================================================

    if (!fs.existsSync(workerDir)) {
      throw new Error(
        `Worker directory was not created: ${workerDir}`
      );
    }

    // ============================================================
    // BUILD WORKER APPSETTINGS
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

    // ============================================================
    // WRITE APPSETTINGS
    // ============================================================

    fs.writeFileSync(
      appSettingsPath,
      JSON.stringify(appSettings, null, 2),
      "utf8"
    );

    console.log(
      "✅ appsettings.json written:",
      appSettingsPath
    );

    // ============================================================
    // SET ENVIRONMENT VARIABLE
    // ============================================================

    process.env.TEST = "12345";

    console.log(
      "TEST environment variable:",
      process.env.TEST
    );

    // ============================================================
    // START WORKER
    // ============================================================

    const workerExe = path.join(
      workerDir,
      "FamousBurgerWorkerService.exe"
    );

    if (!fs.existsSync(workerExe)) {
      throw new Error(
        `Worker EXE not found: ${workerExe}`
      );
    }

    console.log("▶️ Starting Worker:", workerExe);

    execFile(
      workerExe,
      [],
      {
        cwd: workerDir,
        windowsHide: false,
        env: {
          ...process.env,
          TEST: "12345",
        },
      },
      (error) => {
        if (error) {
          console.error(
            "Worker process exited:",
            error
          );
        }
      }
    );

    // ============================================================
    // RETURN
    // ============================================================

    return {
      success: true,

      message:
        "Service installed and configured",

      installPath,

      workerDir,

      workerExe,

      appSettingsPath,

      environment: {
        TEST: process.env.TEST,
      },

      stdout,
      stderr,
    };
  } catch (error) {
    console.error(
      "❌ Installation failed:",
      error
    );

    return {
      success: false,

      message:
        error?.error?.message ||
        error?.message ||
        "Installation failed",

      stdout:
        error?.stdout || "",

      stderr:
        error?.stderr || "",

      error:
        error?.error?.message ||
        error?.message ||
        "Unknown error",
    };
  }
});