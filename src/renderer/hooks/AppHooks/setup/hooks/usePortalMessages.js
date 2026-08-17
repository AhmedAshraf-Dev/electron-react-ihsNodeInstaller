import { useEffect } from "react";

const isValidOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return url.hostname === "portal.ihs.com" ||
      url.hostname === "ihs-solutions.com" ||
      url.hostname.endsWith(".ihs-solutions.com") ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
};

export function usePortalMessages({ setProgress, setError, onSetupComplete }) {
  useEffect(() => {
    const handleMessage = (event) => {
      if (!isValidOrigin(event.origin)) return;
      const { type, payload } = event.data || {};

      switch (type) {
        case "SETUP_COMPLETE":
          onSetupComplete(payload);
          break;
        case "SETUP_PROGRESS":
          setProgress(payload?.progress || 0);
          break;
        case "SETUP_ERROR":
          setError(payload?.message || "Unknown portal error");
          break;
        case "IFRAME_READY":
          console.log("Portal iframe ready");
          break;
        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSetupComplete, setError, setProgress]);
}
