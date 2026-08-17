import { useCallback } from "react";
import { DEFAULT_INSTALL_PATH, DEFAULT_PORT, STEPS } from "../constants";

export function useInstallation({
  printerConfig,
  portalConfig,
  setupResponse,
  setCurrentStep,
  setError,
  setLoading,
  setProgress,
  setServiceStatus,
  safeSetState,
}) {
  return useCallback(async () => {
    if (!setupResponse) {
      safeSetState(setError, "No setup data available");
      return;
    }

    safeSetState(setLoading, true);
    safeSetState(setError, null);
    safeSetState(setProgress, 20);

    try {
      const installConfig = {
        ...printerConfig,
        ...setupResponse,
        ...portalConfig,
        installPath: printerConfig?.installPath || DEFAULT_INSTALL_PATH,
        port: printerConfig?.port || DEFAULT_PORT,
      };

      safeSetState(setProgress, 50);
      if (window.setupAPI?.installService) {
        const result = await window.setupAPI.installService(installConfig);
        safeSetState(setProgress, 80);
        if (!result?.success)
          throw new Error(
            result?.error || result?.message || "Installation failed",
          );

        if (window.setupAPI?.getServiceStatus) {
          const status = await window.setupAPI.getServiceStatus();
          safeSetState(setServiceStatus, status);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        safeSetState(setServiceStatus, {
          installed: true,
          isRunning: true,
          serviceName: "IHSPortalClientService",
        });
      }

      safeSetState(setProgress, 100);
      safeSetState(setCurrentStep, STEPS.COMPLETE);
      safeSetState(setLoading, false);
    } catch (err) {
      safeSetState(setError, err?.message || "Installation failed");
      safeSetState(setLoading, false);
      safeSetState(setProgress, 0);
    }
  }, [
    portalConfig,
    printerConfig,
    safeSetState,
    setCurrentStep,
    setError,
    setLoading,
    setProgress,
    setServiceStatus,
    setupResponse,
  ]);
}
