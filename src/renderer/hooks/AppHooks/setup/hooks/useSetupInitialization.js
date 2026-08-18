import { useEffect } from "react";


export function useSetupInitialization({
  setPortalUrl,
  setSetupResponse,
  setCurrentStep,
  setError,
}) {
  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      console.log("🔄 Loading initial setup data...");

      try {
        // ======================================================
        // PORTAL URL
        // ======================================================

        if (window.setupAPI?.getPortalUrl) {
          console.log("🌐 Loading portal URL...");

          const url = await window.setupAPI.getPortalUrl();

          console.log("🌐 Portal URL:", url);

          if (!cancelled && url) {
            setPortalUrl(url);
          }
        }

        // ======================================================
        // SAVED SETUP RESPONSE
        // ======================================================

        if (window.setupAPI?.getSetupResponse) {
          console.log("📦 Loading saved setup response...");

          const data = await window.setupAPI.getSetupResponse();

          console.log("📦 Saved setup response:", data);

          if (cancelled) {
            console.log("⚠️ Initialization cancelled.");

            return;
          }

          if (data) {
            console.log("✅ Existing setup found.");

            setSetupResponse(data);
            
setCurrentStep(getStepByKey("REVIEW"));
            console.log("➡️ Moving to REVIEW step.");
          } else {
            console.log("ℹ️ No saved setup response found.");
          }
        }
      } catch (err) {
        console.error("❌ Failed to load initial setup data:", err);

        if (!cancelled) {
          setError(err?.message || "Failed to load configuration");
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
      console.log("🧹 Setup initialization cleanup.");
    };
  }, [setCurrentStep, setError, setPortalUrl, setSetupResponse]);
}
