import { useCallback } from "react";

export function usePortal({ iframeRef, portalUrl, setError, setProgress, safeSetState }) {
  const refreshPortal = useCallback(() => {
    if (iframeRef.current) iframeRef.current.src = `${portalUrl.replace(/\/$/, "")}/setup`;
    safeSetState(setError, null); safeSetState(setProgress, 0);
  }, [iframeRef, portalUrl, safeSetState, setError, setProgress]);

  const openPortalInBrowser = useCallback(() => {
    if (window.setupAPI?.openExternal) window.setupAPI.openExternal(portalUrl);
    else window.open(portalUrl, "_blank");
  }, [portalUrl]);

  const testPortalConnection = useCallback(async () => {
    try { await fetch(portalUrl, { method: "HEAD", mode: "no-cors" }); return { success: true }; }
    catch (err) { return { success: false, error: err?.message || "Connection failed" }; }
  }, [portalUrl]);

  return { refreshPortal, openPortalInBrowser, testPortalConnection };
}
