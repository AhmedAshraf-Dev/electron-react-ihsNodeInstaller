import { useCallback } from "react";
import { DEFAULT_INSTALL_PATH, DEFAULT_PORT, getStepByKey } from "../constants";

 // Ensure path is correct

export function useInstallation({
  setupResponse,
  setCurrentStep,
  setError,
  setLoading,
  setProgress,
  setServiceStatus,
  safeSetState,
}) {
  return useCallback(async (overrideData = null) => {
    // 1. Resolve payload (use direct payload or state fallback)
    const payload = overrideData || setupResponse;

    if (!payload) {
      safeSetState(setError, "No setup data available");
      return;
    }

    // 2. Begin installation loading state
    safeSetState(setLoading, true);
    safeSetState(setError, null);
    safeSetState(setProgress, 20);

    try {
      safeSetState(setProgress, 50);

      // 3. Trigger API install or fallback simulation
      if (window.setupAPI?.installService) {
        const result = await window.setupAPI.installService(payload);
        safeSetState(setProgress, 80);

        if (!result?.success) {
          throw new Error(
            result?.error || result?.message || "Installation failed"
          );
        }

        if (window.setupAPI?.getServiceStatus) {
          const status = await window.setupAPI.getServiceStatus();
          safeSetState(setServiceStatus, status);
        }
      } else {
        // Mock fallback for local browser testing
        await new Promise((resolve) => setTimeout(resolve, 1500));
        safeSetState(setServiceStatus, {
          installed: true,
          isRunning: true,
          serviceName: "IHSPortalClientService",
        });
      }

      // 4. Complete installation process
      safeSetState(setProgress, 100);
      safeSetState(setCurrentStep, getStepByKey("COMPLETE"));
      safeSetState(setLoading, false);
    } catch (err) {
      // 5. Handle installation failure
      safeSetState(setError, err?.message || "Installation failed");
      safeSetState(setLoading, false);
      safeSetState(setProgress, 0);
    }
  }, [
    safeSetState,
    setCurrentStep,
    setError,
    setLoading,
    setProgress,
    setServiceStatus,
    setupResponse,
  ]);
}
