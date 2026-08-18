import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useContext,
} from "react";
import "./ReviewStep.css";
import { LanguageContext } from "../context/Language";
const REQUIRED_SPACE_MB = 800;
const DEFAULT_INSTALL_ROOT = "C:\\Program Files\\IHS Client Node";

export const ReviewStep = ({
  setupResponse,
  onInstall,
  handleCancel,
  loading,
  error,
  progress,
}) => {
  const { Right, localization } = useContext(LanguageContext);
  const [installPath, setInstallPath] = useState("");
  const [hasAssignedPrinters, setHasAssignedPrinters] = useState(false);
  const [diskSpace, setDiskSpace] = useState(null);
  const [checkingSpace, setCheckingSpace] = useState(false);
  const [pathError, setPathError] = useState(null);
  const [token, setToken] = useState(null);
  const [orderType, setOrderType] = useState(null);
  const [nodeID, setNodeID] = useState("");

  // Set Default Installation Path
  useEffect(() => {
    if (!setupResponse) return;
    console.log("====================================");
    console.log(setupResponse, "setupResponse test 1234");
    console.log("====================================");
    const nodeId = setupResponse?.nodeID ?? setupResponse?.nodeId ?? "default";
    const defaultPath =
      setupResponse?.installPath || `${DEFAULT_INSTALL_ROOT}\\Node_${nodeId}`;

    setInstallPath(defaultPath);
    setNodeID(nodeId);
    setOrderType(setupResponse?.orderType || -1);
    setToken(setupResponse?.appKey || "");
    const assignedPrinters =
      setupResponse?.printers ?? setupResponse?.assignedPrinters;

    const _hasAssignedPrinters = Array.isArray(assignedPrinters)
      ? assignedPrinters.length > 0
      : !!assignedPrinters;
    setHasAssignedPrinters(_hasAssignedPrinters);
  }, [setupResponse]);

  // Check Disk Space with Cancellation Handling
  const checkDiskSpace = useCallback(
    async (targetPath, signal) => {
      if (!targetPath) {
        setDiskSpace(null);
        return;
      }

      try {
        setCheckingSpace(true);
        setPathError(null);

        if (!window.setupAPI?.getDiskSpace) {
          throw new Error(
            localization?.setup?.reviewStep?.diskSpaceUnavailable ||
              "Disk space API is not available.",
          );
        }

        const result = await window.setupAPI.getDiskSpace(targetPath);

        if (signal.aborted) return;

        if (!result?.success) {
          throw new Error(
            result?.error ||
              localization?.setup?.reviewStep?.diskSpaceCheckFailed ||
              "Failed to check disk space.",
          );
        }

        setDiskSpace(result);
      } catch (err) {
        if (signal.aborted) return;

        console.error("❌ Disk space check failed:", err);
        setDiskSpace(null);
        setPathError(
          err?.message ||
            localization?.setup?.reviewStep?.diskSpaceUnavailableMessage ||
            "Unable to check available disk space.",
        );
      } finally {
        if (!signal.aborted) {
          setCheckingSpace(false);
        }
      }
    },
    [localization],
  );

  // Trigger disk check on path change
  useEffect(() => {
    const controller = new AbortController();
    if (installPath) {
      checkDiskSpace(installPath, controller.signal);
    }
    return () => controller.abort();
  }, [installPath, checkDiskSpace]);

  // Derived Space Status
  const hasEnoughSpace = useMemo(() => {
    return !!diskSpace && diskSpace.freeMB >= REQUIRED_SPACE_MB;
  }, [diskSpace]);

  // Define Review Checks
  const reviewSteps = useMemo(() => {
    return [
      {
        id: "node",
        label:
          localization?.setup?.reviewStep?.nodeConfiguration ||
          "Node configuration",
        checked: !!nodeID && !!orderType,
      },
      {
        id: "clientKey",
        label:
          localization?.setup?.reviewStep?.clientConfiguration ||
          "Client configuration",
        checked: !!token,
      },
      {
        id: "path",
        label:
          localization?.setup?.reviewStep?.installationPath ||
          "Installation path",
        checked: !!installPath && !pathError,
      },
      {
        id: "disk",
        label: localization?.setup?.reviewStep?.diskSpace || "Disk space",
        checked: !!diskSpace && !checkingSpace && hasEnoughSpace,
      },
      {
        id: "printers",
        label:
          localization?.setup?.reviewStep?.printersAssigned ||
          "Printers assigned",
        checked: hasAssignedPrinters,
      },
    ];
  }, [
    setupResponse,
    installPath,
    pathError,
    diskSpace,
    checkingSpace,
    hasEnoughSpace,
    localization,
  ]);

  // Derived Arrays and Progress Values
  const completedSteps = reviewSteps.filter((step) => step.checked);
  const pendingSteps = reviewSteps.filter((step) => !step.checked);
  const completedCount = completedSteps.length;
  const totalSteps = reviewSteps.length;
  const reviewProgress =
    totalSteps === 0 ? 0 : Math.round((completedCount / totalSteps) * 100);
  const allChecksCompleted = completedCount === totalSteps;

  // Handle Installation Click
  const handleInstallClick = () => {
    if (!allChecksCompleted) return;

    onInstall({
      ...setupResponse,
      token,
      nodeID,
      orderType,
    });
  };

  return (
    <div className="review-container">
      {/* ERROR DISPLAY */}
      {(error || pathError) && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{pathError || error}</span>
        </div>
      )}

      {/* REVIEW PROGRESS */}
      <div className="review-progress-section">
        <div className="progress-header">
          <span className="progress-title">
            {localization?.setup?.reviewStep?.progress || "Review Progress"}
          </span>
          <span className="progress-percentage">{reviewProgress}%</span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${reviewProgress}%` }}
          />
        </div>
      </div>

      {/* CHECKLIST */}
      <div className="review-section">
        <div className="section-title">
          {localization?.setup?.reviewStep?.checklist || "CHECKLIST"}
        </div>
        <div className="section-divider" />
        <div className="section-content">
          {pendingSteps.length === 0 ? (
            <span className="empty-text">
              {localization?.setup?.reviewStep?.empty || "(empty)"}
            </span>
          ) : (
            pendingSteps.map((step) => (
              <div key={step.id} className="checklist-row pending">
                <span className="status-icon">○</span>
                <span>{step.label}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DONE */}
      <div className="review-section">
        <div className="section-title">
          {localization?.setup?.reviewStep?.done || "DONE"}
        </div>
        <div className="section-divider" />
        <div className="section-content">
          {completedSteps.length === 0 ? (
            <span className="empty-text">
              {localization?.setup?.reviewStep?.empty || "(empty)"}
            </span>
          ) : (
            completedSteps.map((step) => (
              <div key={step.id} className="checklist-row completed">
                <span className="status-icon">✓</span>
                <span>{step.label}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="review-actions">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="btn-secondary"
        >
          {localization?.setup?.cancel || "Cancel"}
        </button>
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={
            loading || checkingSpace || !allChecksCompleted || progress > 0
          }
          className="btn-install"
        >
          {loading
            ? localization?.setup?.reviewStep?.installing || "Installing..."
            : localization?.setup?.reviewStep?.install || "Install Service"}
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;
