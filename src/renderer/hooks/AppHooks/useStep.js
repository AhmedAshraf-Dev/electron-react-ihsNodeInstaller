import { useCallback, useRef } from "react";
import {  getStepByKey, getStepIndexByKey, STEPS_CONFIG } from "./setup/constants";
import { useInstallation } from "./setup/hooks/useInstallation";
import { usePortal } from "./setup/hooks/usePortal";
import { usePortalMessages } from "./setup/hooks/usePortalMessages";
import { useSetupActions } from "./setup/hooks/useSetupActions";
import { useSetupInitialization } from "./setup/hooks/useSetupInitialization";
import { useSetupState } from "./setup/hooks/useSetupState";


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
      safeSetState(setCurrentStep, getStepByKey("REVIEW"));
      safeSetState(setProgress, 100);
      safeSetState(setLoading, false);
    } catch (err) {
      safeSetState(setError, err?.message || "Failed to process setup data");
      safeSetState(setLoading, false);
    }
  }, [safeSetState, setCurrentStep, setError, setLoading, setProgress, setSetupResponse]);

  usePortalMessages({ setProgress, setError, onSetupComplete: handleSetupComplete });


  const handleNextStep = useCallback((config) => {
  const currentIndex = STEPS_CONFIG.findIndex(
    (step) => step.key === currentStep.key
  );

  if (currentIndex < STEPS_CONFIG.length - 1) {
    setCurrentStep(STEPS_CONFIG[currentIndex + 1]);
    setSetupResponse((prevSetupResponse) => ({
  ...prevSetupResponse,
  ...config,
}));
  }
}, [currentStep]);

  
const handlePreviousStep = useCallback(() => {
  const currentIndex = getStepIndexByKey(currentStep.key);

  if (currentIndex > 0) {
    setCurrentStep(STEPS_CONFIG[currentIndex - 1]);
  }
}, [currentStep]);
// At top level of component
const runInstallation = useInstallation({
  setupResponse,
  setCurrentStep,
  setError,
  setLoading,
  setProgress,
  setServiceStatus,
  safeSetState,
});

// Inside button click or install handler
const handleInstall = (config) => {
  const mergedPayload = { ...setupResponse, ...config };
  setSetupResponse(mergedPayload);
  
  // Trigger function returned by hook
  runInstallation(mergedPayload);
};
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
     handleSetupComplete, handleInstall, handleCancel,handleNextStep,
    handleReinstall, refreshPortal, openPortalInBrowser,handlePreviousStep,
    testPortalConnection, clearError, resetState, setPortalUrl,
    isPortalStep: currentStep === getStepByKey("PORTAL") ,
    isReviewStep: currentStep === getStepByKey("REVIEW") ,
    isCompleteStep: currentStep ===getStepByKey("COMPLETE")  ,
    isInstalling: loading && currentStep === getStepByKey("REVIEW"),
    canInstall: !loading && !!setupResponse && currentStep === getStepByKey("REVIEW"),
    showProgress: progress > 0 && progress < 100,
    getCurrentStep, isStepActive, getStepStatus,
  };
}

export default useSetup;
