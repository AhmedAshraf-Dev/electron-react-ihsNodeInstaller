import { useCallback, useRef } from "react";
import { STEPS, STEPS_CONFIG } from "./setup/constants";
import { useInstallation } from "./setup/hooks/useInstallation";
import { usePortal } from "./setup/hooks/usePortal";
import { usePortalMessages } from "./setup/hooks/usePortalMessages";
import { useSetupActions } from "./setup/hooks/useSetupActions";
import { useSetupInitialization } from "./setup/hooks/useSetupInitialization";
import { useSetupState } from "./setup/hooks/useSetupState";

export { STEPS } from "./setup/constants";

export function useSetup() {
  const state = useSetupState();
  const iframeRef = useRef(null);
  const {
    currentStep, setCurrentStep, printerConfig, setPrinterConfig,
    portalConfig, setPortalConfig, setupResponse, setSetupResponse,
    portalUrl, setPortalUrl, loading, setLoading, error, setError,
    progress, setProgress, serviceStatus, setServiceStatus, sessionId,
    setSessionId, safeSetState,
  } = state;

  useSetupInitialization({ setPortalUrl, setSetupResponse, setCurrentStep, setError });

  const handleSetupComplete = useCallback(async (data) => {
    try {
      safeSetState(setLoading, true);
      safeSetState(setError, null);
      if (window.setupAPI?.setupComplete) {
        const result = await window.setupAPI.setupComplete(data);
        if (!result?.success) throw new Error(result?.error || result?.message || "Failed to save setup data");
      }
      safeSetState(setSetupResponse, data);
      safeSetState(setCurrentStep, STEPS.REVIEW);
      safeSetState(setProgress, 100);
      safeSetState(setLoading, false);
    } catch (err) {
      safeSetState(setError, err?.message || "Failed to process setup data");
      safeSetState(setLoading, false);
    }
  }, [safeSetState, setCurrentStep, setError, setLoading, setProgress, setSetupResponse]);

  usePortalMessages({ setProgress, setError, onSetupComplete: handleSetupComplete });

  const handlePrinterNext = useCallback((config) => {
    setPrinterConfig(config);
    setCurrentStep(STEPS.PORTAL);
  }, [setCurrentStep, setPrinterConfig]);
  const handlePortalNext = useCallback((config) => {
    setPortalConfig(config);
    setCurrentStep(STEPS.REVIEW);
  }, [setCurrentStep, setPortalConfig]);

  const handleInstall = useInstallation({ printerConfig, portalConfig, setupResponse, setCurrentStep, setError, setLoading, setProgress, setServiceStatus, safeSetState });
  const { resetState, handleCancel, handleReinstall } = useSetupActions({ setCurrentStep, setPrinterConfig, setPortalConfig, setSetupResponse, setError, setLoading, setProgress, setServiceStatus, setSessionId });
  const { refreshPortal, openPortalInBrowser, testPortalConnection } = usePortal({ iframeRef, portalUrl, setError, setProgress, safeSetState });

  const clearError = useCallback(() => safeSetState(setError, null), [safeSetState, setError]);
  const currentStepIndex = STEPS_CONFIG.findIndex((item) => item.key === currentStep);
  const getCurrentStep = (index) => STEPS_CONFIG[index];
  const isStepActive = (index) => index === currentStepIndex;
  const getStepStatus = (index) => index < currentStepIndex ? "completed" : index === currentStepIndex ? "active" : "pending";

  return {
    currentStep, printerConfig, portalConfig, setupResponse, portalUrl,
    loading, error, progress, serviceStatus, sessionId,
    steps: STEPS_CONFIG, currentStepIndex,
    handlePrinterNext, handleSetupComplete, handleInstall, handleCancel,
    handleReinstall, handlePortalNext, refreshPortal, openPortalInBrowser,
    testPortalConnection, clearError, resetState, setPortalUrl,
    isPortalStep: currentStep === STEPS.PORTAL,
    isReviewStep: currentStep === STEPS.REVIEW,
    isCompleteStep: currentStep === STEPS.COMPLETE,
    isInstalling: loading && currentStep === STEPS.REVIEW,
    canInstall: !loading && !!setupResponse && currentStep === STEPS.REVIEW,
    showProgress: progress > 0 && progress < 100,
    getCurrentStep, isStepActive, getStepStatus,
  };
}

export default useSetup;
