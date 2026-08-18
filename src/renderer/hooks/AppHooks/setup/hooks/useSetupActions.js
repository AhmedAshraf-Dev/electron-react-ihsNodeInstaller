import { useCallback } from "react";

export function useSetupActions({
  setCurrentStep,
  setPrinterConfig,
  setPortalConfig,
  setSetupResponse,
  setError,
  setLoading,
  setProgress,
  setServiceStatus,
  setSessionId,
}) {
  const showConfirmationDialog = useCallback(async (title, message) => {
    if (window.setupAPI?.showMessageBox) {
      const result = await window.setupAPI.showMessageBox({
        type: "question",
        buttons: ["Yes", "No"],
        defaultId: 1,
        cancelId: 1,
        message: title,
        detail: message,
      });

      return result?.response === 0;
    }

    return window.confirm(`${title}\n\n${message}`);
  }, []);

  const resetState = useCallback(() => {
    setPrinterConfig(null);
    setPortalConfig(null);
    setSetupResponse(null);

    setCurrentStep(getStepByKey("PRINTER"));

    setError(null);
    setLoading(false);
    setProgress(0);
    setServiceStatus(null);
    setSessionId(Date.now().toString().slice(0, 10));
  }, [
    setCurrentStep,
    setError,
    setLoading,
    setPortalConfig,
    setPrinterConfig,
    setProgress,
    setServiceStatus,
    setSessionId,
    setSetupResponse,
  ]);

  const handleCancel = useCallback(async () => {
    if (
      !(await showConfirmationDialog(
        "Cancel Setup?",
        "All progress will be lost. Are you sure?",
      ))
    ) {
      return;
    }

    try {
      if (window.setupAPI?.resetSetup) {
        await window.setupAPI.resetSetup();
      }
    } catch (err) {
      console.error("Failed to reset setup:", err);
    }

    resetState();
  }, [resetState, showConfirmationDialog]);

  // ============================================================
  // REINSTALL SERVICE
  // ============================================================

  const handleReinstall = useCallback(
    async (config) => {
      try {
        // --------------------------------------------------------
        // CONFIRM
        // --------------------------------------------------------

        const confirmed = await showConfirmationDialog(
          "Reinstall Service?",
          "The existing Client Node service will be stopped and reinstalled. Continue?",
        );

        if (!confirmed) {
          return {
            success: false,
            cancelled: true,
          };
        }

        // --------------------------------------------------------
        // VALIDATE IPC
        // --------------------------------------------------------

        if (!window.setupAPI?.reinstallService) {
          throw new Error("Reinstall service API is not available.");
        }

        // --------------------------------------------------------
        // VALIDATE CONFIG
        // --------------------------------------------------------

        if (!config) {
          throw new Error("Installation configuration is required.");
        }

        if (!config.installPath) {
          throw new Error("Installation path is required.");
        }

        // --------------------------------------------------------
        // UI STATE
        // --------------------------------------------------------

        setLoading(true);
        setError(null);
        setProgress(10);

        console.log("🔄 Starting service reinstall:", config);

        // --------------------------------------------------------
        // REINSTALL
        // --------------------------------------------------------

        setProgress(20);

        const result = await window.setupAPI.reinstallService(config);

        console.log("📦 Reinstall result:", result);

        // --------------------------------------------------------
        // FAILED
        // --------------------------------------------------------

        if (!result?.success) {
          throw new Error(
            result?.error || result?.message || "Service reinstall failed.",
          );
        }

        // --------------------------------------------------------
        // SUCCESS
        // --------------------------------------------------------

        setProgress(100);

        console.log("✅ Service reinstalled successfully.");

        // Save the new installation response if needed
        if (result.installation) {
          setSetupResponse(result.installation);
        }

        // --------------------------------------------------------
        // RESET SETUP STORAGE
        // --------------------------------------------------------

        try {
          if (window.setupAPI?.resetSetup) {
            await window.setupAPI.resetSetup();
          }
        } catch (resetError) {
          console.error("Failed to reset setup after reinstall:", resetError);
        }

        // --------------------------------------------------------
        // RESET UI
        // --------------------------------------------------------

        resetState();

        return {
          success: true,
          result,
        };
      } catch (err) {
        console.error("❌ Service reinstall failed:", err);

        setError(err?.message || "Service reinstall failed.");

        setProgress(0);

        return {
          success: false,
          error: err?.message || "Service reinstall failed.",
        };
      } finally {
        setLoading(false);
      }
    },
    [
      resetState,
      setError,
      setLoading,
      setProgress,
      setSetupResponse,
      showConfirmationDialog,
    ],
  );

  return {
    showConfirmationDialog,
    resetState,
    handleCancel,
    handleReinstall,
  };
}
