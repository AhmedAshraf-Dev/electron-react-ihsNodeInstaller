import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_PORTAL_URL, STEPS } from "../constants";

export function useSetupState() {
  const [currentStep, setCurrentStep] = useState(STEPS.PRINTER);
  const [printerConfig, setPrinterConfig] = useState(null);
  const [portalConfig, setPortalConfig] = useState(null);
  const [setupResponse, setSetupResponse] = useState(null);
  const [portalUrl, setPortalUrl] = useState(DEFAULT_PORTAL_URL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [serviceStatus, setServiceStatus] = useState(null);
  const [sessionId, setSessionId] = useState(() => Date.now().toString().slice(0, 10));
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const safeSetState = useCallback((setter, value) => {
    if (isMounted.current) setter(value);
  }, []);

  return {
    currentStep, setCurrentStep, printerConfig, setPrinterConfig,
    portalConfig, setPortalConfig, setupResponse, setSetupResponse,
    portalUrl, setPortalUrl, loading, setLoading, error, setError,
    progress, setProgress, serviceStatus, setServiceStatus,
    sessionId, setSessionId, safeSetState,
  };
}
