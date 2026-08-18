// ============================================================
//  PortalStep.jsx - Portal Integration Component
//  Handles iframe loading and communication with portal
// ============================================================

import React, { useState, useEffect, useRef, useContext } from "react";
import "./PortalStep.css";
import { LanguageContext } from "../context/Language";

// ============================================================
//  COMPONENT
// ============================================================
export function PortalStep({
  portalUrl,
  onSetupComplete,
  onCancel,
  loading,
  error,
  progress,
  handlePortalNext,
}) {
  const iframeRef = useRef(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const { Right, localization, Lan } = useContext(LanguageContext);
  // ============================================================
  //  EFFECTS
  // ============================================================

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      // Validate origin for security
      if (!isValidOrigin(event.origin)) return;

      console.log("📨 Message from iframe:", event.data);

      const { type, payload } = event.data;

      switch (type) {
        case "SETUP_COMPLETE":
          onSetupComplete(payload);
          break;
        case "SETUP_PROGRESS":
          // Progress is handled by parent
          break;
        case "IFRAME_READY":
          setIframeLoaded(true);
          setIsConnecting(false);
          break;
        case "SETUP_ERROR":
          setIframeError(payload?.message || localization?.setup?.portalSetup?.unknownError || "Unknown error");
          break;
        case "FORM_SUBMIT":
          handlePortalNext(payload);
          break;
        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSetupComplete, handlePortalNext, localization]);

  // Send ready message to iframe when it loads
  useEffect(() => {
    if (iframeLoaded && iframeRef.current) {
      try {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "PARENT_READY",
            payload: { ready: true },
          },
          "*",
        );
      } catch (err) {
        console.error("Failed to send ready message:", err);
      }
    }
  }, [iframeLoaded]);

  // ============================================================
  //  HANDLERS
  // ============================================================

  const handleIframeLoad = () => {
    console.log("✅ Iframe loaded");
    setIframeLoaded(true);
    setIsConnecting(false);
    setIframeError(null);
  };

  const handleIframeError = () => {
    console.error("❌ Iframe failed to load");
    setIframeError(localization?.setup?.portalSetup?.loadError || "Failed to load portal. Please check your connection.");
    setIsConnecting(false);
  };

  const handleRefresh = () => {
    setIsConnecting(true);
    setIframeLoaded(false);
    setIframeError(null);

    if (iframeRef.current) {
      iframeRef.current.src = `${portalUrl}`;
    }
  };

  const handleOpenBrowser = () => {
    if (window.setupAPI?.openExternal) {
      window.setupAPI.openExternal(portalUrl);
    } else {
      window.open(portalUrl, "_blank");
    }
  };

  // ============================================================
  //  UTILITY
  // ============================================================

  const isValidOrigin = (origin) => {
    return (
      origin.includes("ihs.com") ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.includes("file://")
    );
  };

  // ============================================================
  //  RENDER
  // ============================================================

  return (
    <div className="portal-step">
      <div className="portal-header">
        <h2 className="content-title">
          {localization?.setup?.portalSetup?.title ||
            "Complete Setup in Portal"}
        </h2>
        <p className="content-description">
          {localization?.setup?.portalSetup?.desc ||
            "Complete all steps in the portal. Setup will continue automatically."}
        </p>

        {error && (
          <div className="error-box">
            <span>⚠️ {error}</span>
            <button className="btn-retry" onClick={onCancel}>
              {localization?.setup?.portalSetup?.dismiss || "Dismiss"}
            </button>
          </div>
        )}

        {iframeError && (
          <div className="error-box">
            <span>❌ {iframeError}</span>
            <button className="btn-retry" onClick={handleRefresh}>
              {localization?.setup?.portalSetup?.retry || "Retry"}
            </button>
          </div>
        )}

        <div className="portal-url-bar">
          <span>
            {localization?.setup?.portalSetup?.portal || "Portal:"}
            <strong>{portalUrl}</strong>
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            {localization?.setup?.portalSetup?.refresh || "🔄 Refresh"}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleOpenBrowser}
            disabled={loading}
          >
            {localization?.setup?.portalSetup?.openInBrowser ||
              "🌐 Open in Browser"}
          </button>
          <span className="connection-status">
            {isConnecting
              ? localization?.setup?.portalSetup?.connecting || "⏳ Connecting..."
              : iframeLoaded
                ? localization?.setup?.portalSetup?.connected || "✅ Connected"
                : localization?.setup?.portalSetup?.disconnected ||
                  "❌ Disconnected"}
          </span>
        </div>

        {progress > 0 && progress < 100 && (
          <div className="progress-bar">
            <div className="bar" style={{ width: `${progress}%` }} />
            <span className="text">{progress}%</span>
          </div>
        )}
      </div>

      <div className="iframe-wrapper">
        {!iframeLoaded && (
          <div className="iframe-loader">
            <div className="spinner"></div>
            <p>
              {localization?.setup?.portalSetup?.loadingPortal ||
                "Loading portal..."}{" "}
            </p>
            <p className="loader-sub">
              {localization?.setup?.portalSetup?.pleaseWait || "Please wait..."}
            </p>
          </div>
        )}

        <iframe
          ref={iframeRef}
          className="iframe min-h-[400px]"
          src={`${portalUrl}?shortName=${Lan}`}
          style={{ display: iframeLoaded ? "block" : "none" }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
          allow="camera; microphone; fullscreen"
          title={localization?.setup?.portalSetup?.iframeTitle || "IHS Portal Setup"}
        />
      </div>

      <div className="portal-actions">
        <button
          className="btn btn-danger"
          onClick={onCancel}
          disabled={loading}
        >
          {localization?.setup?.cancel || "Cancel Setup"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleRefresh}
          disabled={loading}
        >
          {localization?.setup?.portalSetup?.refreshPortal || "Refresh Portal"}
        </button>
        <button
          className="btn btn-primary"
          onClick={handleOpenBrowser}
          disabled={loading}
        >
          {localization?.setup?.portalSetup?.openInBrowser || "Open in Browser"}
        </button>
      </div>

      <div className="portal-tip">
        <strong>{localization?.setup?.portalSetup?.tip || "💡 Tip:"}</strong>
        {localization?.setup?.portalSetup?.whenCompleted ||
          "The portal will send setup data automatically when completed."}

        {!iframeLoaded && !iframeError && !isConnecting && (
          <span style={{ display: "block", marginTop: "8px" }}>
            {localization?.setup?.portalSetup?.waiting ||
              "⏳ Waiting for portal to load..."}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  EXPORT
// ============================================================
export default PortalStep;
