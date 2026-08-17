import React, { useEffect, useState } from "react";

const REQUIRED_SPACE_MB = 800;

const DEFAULT_INSTALL_ROOT = "C:\\Program Files\\IHS Client Node";

export const ReviewStep = ({
  setupResponse,
  printerConfig,
  onInstall,
  handleCancel,
  loading,
  error,
  progress,
}) => {
  const [installPath, setInstallPath] = useState("");

  const [diskSpace, setDiskSpace] = useState(null);

  const [checkingSpace, setCheckingSpace] = useState(false);

  const [pathError, setPathError] = useState(null);

  // ============================================================
  // DEFAULT INSTALLATION PATH
  // ============================================================
  console.log(setupResponse, "setupResponse test 123");

  useEffect(() => {
    if (!setupResponse) {
      return;
    }

    const nodeId = setupResponse.nodeId || "default";

    const defaultPath =
      printerConfig?.installPath || `${DEFAULT_INSTALL_ROOT}\\Node_${nodeId}`;

    setInstallPath(defaultPath);
  }, [setupResponse, printerConfig]);

  // ============================================================
  // CHECK DISK SPACE
  // ============================================================

  const checkDiskSpace = async (targetPath) => {
    if (!targetPath) {
      setDiskSpace(null);
      return;
    }

    try {
      setCheckingSpace(true);
      setPathError(null);

      if (!window.setupAPI?.getDiskSpace) {
        throw new Error("Disk space API is not available.");
      }

      const result = await window.setupAPI.getDiskSpace(targetPath);

      console.log("💾 Disk space:", result);

      if (!result?.success) {
        throw new Error(result?.error || "Failed to check disk space.");
      }

      setDiskSpace(result);
    } catch (err) {
      console.error("❌ Disk space check failed:", err);

      setDiskSpace(null);

      setPathError(err?.message || "Unable to check available disk space.");
    } finally {
      setCheckingSpace(false);
    }
  };

  // ============================================================
  // CHECK DEFAULT PATH
  // ============================================================

  useEffect(() => {
    if (installPath) {
      checkDiskSpace(installPath);
    }
  }, [installPath]);

  // ============================================================
  // BROWSE
  // ============================================================

  const handleBrowse = async () => {
    try {
      const result = await window.setupAPI?.showOpenDialog?.({
        properties: ["openDirectory"],
        title: "Select Installation Directory",
      });

      if (!result?.canceled && result?.filePaths?.length > 0) {
        const selectedPath = result.filePaths[0];

        setInstallPath(selectedPath);
      }
    } catch (err) {
      console.error("❌ Failed to select directory:", err);

      setPathError(err?.message || "Failed to select installation directory.");
    }
  };

  // ============================================================
  // INSTALL
  // ============================================================

  const handleInstallClick = () => {
    if (!installPath) {
      setPathError("Please select an installation directory.");

      return;
    }

    if (checkingSpace) {
      return;
    }

    if (!diskSpace) {
      setPathError("Unable to verify available disk space.");

      return;
    }

    if (diskSpace.freeMB < REQUIRED_SPACE_MB) {
      setPathError(
        `Not enough disk space. At least ${REQUIRED_SPACE_MB} MB is required.`,
      );

      return;
    }

    onInstall({
      installPath,
    });
  };

  // ============================================================
  // NO SETUP RESPONSE
  // ============================================================

  // if (!setupResponse) {
  //   return (
  //     <div className="step-content review-step">
  //       <div className="loading-state">
  //         <div className="spinner" />
  //         <p>Loading setup configuration...</p>
  //       </div>
  //     </div>
  //   );
  // }

  const hasEnoughSpace = diskSpace && diskSpace.freeMB >= REQUIRED_SPACE_MB;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="step-content review-step">
      <h2>Review Setup Configuration</h2>

      <p className="step-description">
        Review the configuration and confirm the installation.
      </p>

      {/* ERROR */}

      {(error || pathError) && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>

          {pathError || error}
        </div>
      )}

      {/* ======================================================
          NODE CONFIGURATION
          ====================================================== */}

      <div className="review-details">
        <div className="detail-section">
          <h3>Node Configuration</h3>

          <div className="detail-grid">
            <div className="detail-item">
              <label>Node ID</label>

              <span>{setupResponse.nodeID || "N/A"}</span>
            </div>

            <div className="detail-item">
              <label>Node Name</label>

              <span>{setupResponse.node_Name || "N/A"}</span>
            </div>

            <div className="detail-item">
              <label>Order Type</label>

              <span>{setupResponse.orderType || "N/A"}</span>
            </div>

            <div className="detail-item">
              <label>Environment</label>

              <span>{setupResponse.environment || "production"}</span>
            </div>
          </div>
        </div>

        {/* ====================================================
            CLIENT CONFIGURATION
            ==================================================== */}

        <div className="detail-section">
          <h3>Client Configuration</h3>

          <div className="detail-grid">
            <div className="detail-item">
              <label>Client Key</label>

              <span className="key-display">
                {setupResponse.appKey || "N/A"}
              </span>
            </div>

            <div className="detail-item">
              <label>Port</label>a<span>{setupResponse.port || 8080}</span>
            </div>

            <div className="detail-item">
              <label>API Endpoint</label>

              <span>{setupResponse.apiEndpoint || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* ====================================================
            INSTALLATION
            ==================================================== */}

        <div className="detail-section">
          <h3>Installation Settings</h3>

          <div className="detail-item">
            <label>Installation Path</label>

            <div className="path-selector">
              <input
                type="text"
                value={installPath}
                onChange={(event) => {
                  setInstallPath(event.target.value);

                  setDiskSpace(null);
                  setPathError(null);
                }}
                disabled={loading}
              />

              <button
                type="button"
                onClick={handleBrowse}
                disabled={loading}
                className="btn-secondary"
              >
                Browse
              </button>
            </div>
          </div>

          {/* ==================================================
              DISK SPACE
              ================================================== */}

          <div className="disk-space">
            <div className="disk-space-header">
              <span>Available Disk Space</span>

              <span>Required: {REQUIRED_SPACE_MB} MB</span>
            </div>

            {checkingSpace ? (
              <div className="disk-space-checking">
                Checking available space...
              </div>
            ) : !diskSpace ? (
              <div className="disk-space-warning">
                Unable to determine available disk space.
              </div>
            ) : hasEnoughSpace ? (
              <div className="disk-space-success">
                <span>✓</span>

                <span>{diskSpace.freeGB} GB available</span>
              </div>
            ) : (
              <div className="disk-space-error">
                <span>⚠️</span>

                <span>
                  Only {diskSpace.freeGB} GB available. At least{" "}
                  {REQUIRED_SPACE_MB} MB is required.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================
          PROGRESS
          ====================================================== */}

      {progress > 0 && progress < 100 && (
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{
              width: `${progress}%`,
            }}
          />

          <span className="progress-text">Installing... {progress}%</span>
        </div>
      )}

      {/* ======================================================
          ACTIONS
          ====================================================== */}

      <div className="review-actions">
        <button
          type="button"
          onClick={handleInstallClick}
          // disabled={
          //   // loading ||
          //   // checkingSpace ||
          //   // !diskSpace ||
          //   // !hasEnoughSpace ||
          //   // progress > 0
          // }
          className="btn-install"
        >
          {loading ? "Installing..." : "Install Service"}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;
