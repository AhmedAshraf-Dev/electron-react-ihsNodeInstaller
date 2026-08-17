// ============================================================
//  PortalStep.jsx - Portal Integration Component
//  Handles iframe loading and communication with portal
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import "./PortalStep.css";

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
  console.log("test 12345 portalUrl", portalUrl);
  const iframeRef = useRef(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

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
          setIframeError(payload?.message || "Unknown error");
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
  }, [onSetupComplete]);

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
    setIframeError("Failed to load portal. Please check your connection.");
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
        <h2 className="content-title">Complete Setup in Portal</h2>
        <p className="content-description">
          Complete all steps in the portal. Setup will continue automatically.
        </p>

        {error && (
          <div className="error-box">
            <span>⚠️ {error}</span>
            <button className="btn-retry" onClick={onCancel}>
              Dismiss
            </button>
          </div>
        )}

        {iframeError && (
          <div className="error-box">
            <span>❌ {iframeError}</span>
            <button className="btn-retry" onClick={handleRefresh}>
              Retry
            </button>
          </div>
        )}

        <div className="portal-url-bar">
          <span>
            Portal: <strong>{portalUrl}</strong>
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleOpenBrowser}
            disabled={loading}
          >
            🌐 Open in Browser
          </button>
          <span className="connection-status">
            {isConnecting
              ? "⏳ Connecting..."
              : iframeLoaded
                ? "✅ Connected"
                : "❌ Disconnected"}
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
            <p>Loading portal...</p>
            <p className="loader-sub">Please wait...</p>
          </div>
        )}

        <iframe
          ref={iframeRef}
          className="iframe"
          src={`${portalUrl}`}
          style={{ display: iframeLoaded ? "block" : "none" }}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals"
          allow="camera; microphone; fullscreen"
          title="IHS Portal Setup"
        />
      </div>

      <div className="portal-actions">
        <button
          className="btn btn-danger"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel Setup
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh Portal
        </button>
        <button
          className="btn btn-primary"
          onClick={handleOpenBrowser}
          disabled={loading}
        >
          Open in Browser
        </button>
      </div>

      <div className="portal-tip">
        <strong>💡 Tip:</strong> The portal will send setup data automatically
        when completed.
        {!iframeLoaded && !iframeError && !isConnecting && (
          <span style={{ display: "block", marginTop: "8px" }}>
            ⏳ Waiting for portal to load...
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
