import { useCallback } from "react";
import { STEPS } from "../constants";

export function useSetupActions({ setCurrentStep, setPrinterConfig, setPortalConfig, setSetupResponse, setError, setLoading, setProgress, setServiceStatus, setSessionId }) {
  const showConfirmationDialog = useCallback(async (title, message) => {
    if (window.setupAPI?.showMessageBox) {
      const result = await window.setupAPI.showMessageBox({ type: "question", buttons: ["Yes", "No"], defaultId: 1, cancelId: 1, message: title, detail: message });
      return result?.response === 0;
    }
    return window.confirm(`${title}\n\n${message}`);
  }, []);

  const resetState = useCallback(() => {
    setPrinterConfig(null); setPortalConfig(null); setSetupResponse(null);
    setCurrentStep(STEPS.PRINTER); setError(null); setLoading(false); setProgress(0);
    setServiceStatus(null); setSessionId(Date.now().toString().slice(0, 10));
  }, [setCurrentStep, setError, setLoading, setPortalConfig, setPrinterConfig, setProgress, setServiceStatus, setSessionId, setSetupResponse]);

  const handleCancel = useCallback(async () => {
    if (!await showConfirmationDialog("Cancel Setup?", "All progress will be lost. Are you sure?")) return;
    try { if (window.setupAPI?.resetSetup) await window.setupAPI.resetSetup(); }
    catch (err) { console.error("Failed to reset setup:", err); }
    resetState();
  }, [resetState, showConfirmationDialog]);

  const handleReinstall = useCallback(async () => {
    try { if (window.setupAPI?.resetSetup) await window.setupAPI.resetSetup(); }
    catch (err) { console.error("Failed to reset setup:", err); }
    resetState();
  }, [resetState]);

  return { showConfirmationDialog, resetState, handleCancel, handleReinstall };
}
