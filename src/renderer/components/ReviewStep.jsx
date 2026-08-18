import React, { useEffect, useMemo, useState, useCallback, useContext } from "react";
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
  progress
}) => {
  const { Right, localization } = useContext(LanguageContext);
  const [installPath, setInstallPath] = useState("");
  const [hasAssignedPrinters, setHasAssignedPrinters] = useState(false);
  const [diskSpace, setDiskSpace] = useState(null);
  const [checkingSpace, setCheckingSpace] = useState(false);
  const [pathError, setPathError] = useState(null);
  const [token, setToken] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMzdiN2YzNS0wZWEyLTQxNGYtOGQ4My02OTY0ODEyNzFhMjUiLCJqdGkiOiJmODQ4NzAxZi1mM2Y5LTQ4M2UtOGU4Mi0xZTViOGJiZWRkNTgiLCJpc3MiOiJJSFMiLCJpYXQiOjE3Nzg2OTQ0OTcsImV4cCI6MTc4NjY0MzI5NywiVXNlcm5hbWUiOiJBZG1pbiIsIlJvbGUiOiI4IiwiVXNlcklEIjoiZTM3YjdmMzUtMGVhMi00MTRmLThkODMtNjk2NDgxMjcxYTI1IiwiSm9iVHlwZUlEIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwiUGVyc29uSUQiOiI1ZDFjYjQ4Zi0wNjQwLTQwMjctYmM0MS0xNGRjMjA5YmRjMzMiLCJVc2VyVG9rZW5JRCI6IjMyMWMzMWM3LTM4ODQtNGFjNi1hYjBjLTVlZjBmNjIzZDAxYiIsIkNsaWVudElEIjoiZDM4MDQzNTUtYTA5Yy00NmVjLTkxMGMtZGMwMjRhNGJhZTFiIiwiVXNlcnNHcm91cElEIjoiNTY0Y2Y2NWYtMTMxMi00OGQxLWI5OGMtOGRjMTU0Y2VmYzU5IiwiVXNlcnNHcm91cERhc2hib2FyZEZvcm1TY2hlbWFBY3Rpb25zIjoiW3tcIlVzZXJzR3JvdXBEYXNoYm9hcmRGb3JtU2NoZW1hQWN0aW9uSURcIjpcImE5Zjk4Y2MzLTZhNTgtNDNlOC04MjI0LTE4YThiOWVjN2FlZlwiLFwiUm91dGVBZGRlcnNzXCI6XCJTaG9wTm9kZS9VcGRhdGVOb2RlTWVudUl0ZW1cIixcIkRhc2hib2FyZEZvcm1BY3Rpb25NZXRob2RUeXBlXCI6XCJQdXRcIixcIlVzZXJzR3JvdXBJRFwiOlwiNTY0Y2Y2NWYtMTMxMi00OGQxLWI5OGMtOGRjMTU0Y2VmYzU5XCIsXCJEYXNoYm9hcmRGb3JtU2NoZW1hQWN0aW9uSURcIjpcImE5Zjk4Y2MzLTZhNTgtNDNlOC04MjI0LTE4YThiOWVjN2FlZlwifSx7XCJVc2Vyc0dyb3VwRGFzaGJvYXJkRm9ybVNjaGVtYUFjdGlvbklEXCI6XCJhOWY5OGNjMy02YTU4LTQzZTgtODIyNC0xOGE4YjllYzdhZWZcIixcIlJvdXRlQWRkZXJzc1wiOlwiU2hvcE5vZGUvVXBkYXRlTm9kZU1lbnVJdGVtXCIsXCJEYXNoYm9hcmRGb3JtQWN0aW9uTWV0aG9kVHlwZVwiOlwiUHV0XCIsXCJVc2Vyc0dyb3VwSURcIjpcIjU2NGNmNjVmLTEzMTItNDhkMS1iOThjLThkYzE1NGNlZmM1OVwiLFwiRGFzaGJvYXJkRm9ybVNjaGVtYUFjdGlvbklEXCI6XCJhOWY5OGNjMy02YTU4LTQzZTgtODIyNC0xOGE4YjllYzdhZWZcIn0se1wiVXNlcnNHcm91cERhc2hib2FyZEZvcm1TY2hlbWFBY3Rpb25JRFwiOlwiNzQzYTViNDktY2EyZi00NmM4LTllOTItOWU1YmIxZWUyMWJjXCIsXCJSb3V0ZUFkZGVyc3NcIjpcIkFzc2V0L0FkZERpc3BsYXlGaWxlRm9yQXNzZXRcIixcIkRhc2hib2FyZEZvcm1BY3Rpb25NZXRob2RUeXBlXCI6XCJQb3N0XCIsXCJVc2Vyc0dyb3VwSURcIjpcIjU2NGNmNjVmLTEzMTItNDhkMS1iOThjLThkYzE1NGNlZmM1OVwiLFwiRGFzaGJvYXJkRm9ybVNjaGVtYUFjdGlvbklEXCI6XCI3NDNhNWI0OS1jYTJmLTQ2YzgtOWU5Mi05ZTViYjFlZTIxYmNcIn0se1wiVXNlcnNHcm91cERhc2hib2FyZEZvcm1TY2hlbWFBY3Rpb25JRFwiOlwiYTlmOThjYzMtNmE1OC00M2U4LTgyMjQtMThhOGI5ZWM3YWVmXCIsXCJSb3V0ZUFkZGVyc3NcIjpcIlNob3BOb2RlL1VwZGF0ZU5vZGVNZW51SXRlbVwiLFwiRGFzaGJvYXJkRm9ybUFjdGlvbk1ldGhvZFR5cGVcIjpcIlB1dFwiLFwiVXNlcnNHcm91cElEXCI6XCI1NjRjZjY1Zi0xMzEyLTQ4ZDEtYjk4Yy04ZGMxNTRjZWZjNTlcIixcIkRhc2hib2FyZEZvcm1TY2hlbWFBY3Rpb25JRFwiOlwiYTlmOThjYzMtNmE1OC00M2U4LTgyMjQtMThhOGI5ZWM3YWVmXCJ9XSIsIlVzZXJzR3JvdXBEYXNoYm9hcmRNZW51SXRlbXMiOiJbe1wiVXNlcnNHcm91cERhc2hib2FyZE1lbnVJdGVtSURcIjpcIjljZjE1NjBlLTAwNjQtNDViZS1iNjVkLTNjNDM2ZTViZWQxYVwiLFwiRGFzaGJvYXJkTWVudUl0ZW1OYW1lXCI6XCLYp9mE2LnZgtin2LHYp9iqINin2YjZhtmE2YrZhlwiLFwiUm91dGVQYXRoXCI6XCJkeW5hbWljRm9ybVwiLFwiVXNlcnNHcm91cElEXCI6XCI1NjRjZjY1Zi0xMzEyLTQ4ZDEtYjk4Yy04ZGMxNTRjZWZjNTlcIixcIkRhc2hib2FyZEl0ZW1JRFwiOlwiOWNmMTU2MGUtMDA2NC00NWJlLWI2NWQtM2M0MzZlNWJlZDFhXCJ9LHtcIlVzZXJzR3JvdXBEYXNoYm9hcmRNZW51SXRlbUlEXCI6XCJkY2Y3YWE3MS02MGQxLTQwNzEtOTA4Ni01MWViNjdiMDFhNzdcIixcIkRhc2hib2FyZE1lbnVJdGVtTmFtZVwiOlwi2LXZgdin2KpcIixcIlJvdXRlUGF0aFwiOlwiZHluYW1pY1RhYmxlXCIsXCJVc2Vyc0dyb3VwSURcIjpcIjU2NGNmNjVmLTEzMTItNDhkMS1iOThjLThkYzE1NGNlZmM1OVwiLFwiRGFzaGJvYXJkSXRlbUlEXCI6XCJkY2Y3YWE3MS02MGQxLTQwNzEtOTA4Ni01MWViNjdiMDFhNzdcIn0se1wiVXNlcnNHcm91cERhc2hib2FyZE1lbnVJdGVtSURcIjpcImRjZjdhYTcxLTYwZDEtNDA3MS05MDg2LTUxZWI2N2IwMWE3OVwiLFwiRGFzaGJvYXJkTWVudUl0ZW1OYW1lXCI6XCLYp9mE2YXYs9mF2YrYp9iqINin2YTZiNi42YrZgdmK2KlcIixcIlJvdXRlUGF0aFwiOlwiZHluYW1pY1RhYmxlXCIsXCJVc2Vyc0dyb3VwSURcIjpcIjU2NGNmNjVmLTEzMTItNDhkMS1iOThjLThkYzE1NGNlZmM1OVwiLFwiRGFzaGJvYXJkSXRlbUlEXCI6XCJkY2Y3YWE3MS02MGQxLTQwNzEtOTA4Ni01MWViNjdiMDFhNzlcIn0se1wiVXNlcnNHcm91cERhc2hib2FyZE1lbnVJdGVtSURcIjpcIjQyMmQ4YWE0LTRhMTQtNDkyNS1iMDA1LTU3ZTFkZDY3NjUwNVwiLFwiRGFzaGJvYXJkTWVudUl0ZW1OYW1lXCI6XCLYudmC2KfYsdin2Kog2KzYr9mK2K_YqVwiLFwiUm91dGVQYXRoXCI6XCJkeW5hbWljVGFibGVcIixcIlVzZXJzR3JvdXBJRFwiOlwiNTY0Y2Y2NWYtMTMxMi00OGQxLWI5OGMtOGRjMTU0Y2VmYzU5XCIsXCJEYXNoYm9hcmRJdGVtSURcIjpcIjAyMmU4OTMyLTAwZTItNGZlYi05NmM5LTVjMDA3YzhkNzJiN1wifSx7XCJVc2Vyc0dyb3VwRGFzaGJvYXJkTWVudUl0ZW1JRFwiOlwiZTkwMzU3MDgtMTExNi00OGIwLWFhODItNzI4Yjk3OWMwYzM3XCIsXCJEYXNoYm9hcmRNZW51SXRlbU5hbWVcIjpcIti52YbYp9i12LEg2YbZgti32Kkg2KfZhNin2LPYp9iz2YrYqVwiLFwiUm91dGVQYXRoXCI6XCJkeW5hbWljVGFibGVcIixcIlVzZXJzR3JvdXBJRFwiOlwiNTY0Y2Y2NWYtMTMxMi00OGQxLWI5OGMtOGRjMTU0Y2VmYzU5XCIsXCJEYXNoYm9hcmRJdGVtSURcIjpcImMxOGFkNDdjLWNlMTEtNDNkOC1iNWI5LWRjZmE0Zjc1Yjc2YlwifSx7XCJVc2Vyc0dyb3VwRGFzaGJvYXJkTWVudUl0ZW1JRFwiOlwiNzY1MWZhOGUtZmE0NS00MWY3LWIxZTItYjE2ODJhY2RiYmMxXCIsXCJEYXNoYm9hcmRNZW51SXRlbU5hbWVcIjpcItiz2YXYp9iqINin2YTYo9i12YjZhCDYp9mE2LnYp9mF2KlcIixcIlJvdXRlUGF0aFwiOlwiZHluYW1pY1RyZWVcIixcIlVzZXJzR3JvdXBJRFwiOlwiNTY0Y2Y2NWYtMTMxMi00OGQxLWI5OGMtOGRjMTU0Y2VmYzU5XCIsXCJEYXNoYm9hcmRJdGVtSURcIjpcIjc2NTFmYThlLWZhNDUtNDFmNy1iMWUyLWIxNjgyYWNkYmJjMVwifSx7XCJVc2Vyc0dyb3VwRGFzaGJvYXJkTWVudUl0ZW1JRFwiOlwiNDUxMmQ3YWMtOTQ0My00YTViLTlhYmMtYjFlOGIzZmJlNDE5XCIsXCJEYXNoYm9hcmRNZW51SXRlbU5hbWVcIjpcIti52YbYp9i12LEg2KfZhNmC2KfYptmF2KlcIixcIlJvdXRlUGF0aFwiOlwiZHluYW1pY1RhYmxlXCIsXCJVc2Vyc0dyb3VwSURcIjpcIjU2NGNmNjVmLTEzMTItNDhkMS1iOThjLThkYzE1NGNlZmM1OVwiLFwiRGFzaGJvYXJkSXRlbUlEXCI6XCIxN2QwNTIwZi00OWNiLTQzNTctYjU5OS0zYTM3MDdiMTc2MzBcIn0se1wiVXNlcnNHcm91cERhc2hib2FyZE1lbnVJdGVtSURcIjpcIjA4ZjBiMDg2LThkMTUtNDJhNC04NjkyLWI5MTFiMzQ0OGNmMlwiLFwiRGFzaGJvYXJkTWVudUl0ZW1OYW1lXCI6XCLZhdmE2LXZgtin2KpcIixcIlJvdXRlUGF0aFwiOlwiZHluYW1pY1RhYmxlXCIsXCJVc2Vyc0dyb3VwSURcIjpcIjU2NGNmNjVmLTEzMTItNDhkMS1iOThjLThkYzE1NGNlZmM1OVwiLFwiRGFzaGJvYXJkSXRlbUlEXCI6XCIwOGYwYjA4Ni04ZDE1LTQyYTQtODY5Mi1iOTExYjM0NDhjZjJcIn0se1wiVXNlcnNHcm91cERhc2hib2FyZE1lbnVJdGVtSURcIjpcImMxODM1M2EyLTk3ZDAtNDJjMy05YjY0LWI5ZDFkYWUwOTJiMlwiLFwiRGFzaGJvYXJkTWVudUl0ZW1OYW1lXCI6XCLZhdi52KfZhNis2Kkg2KfZhNi12YHYrdin2KpcIixcIlJvdXRlUGF0aFwiOlwiZHluYW1pY1RhYmxlXCIsXCJVc2Vyc0dyb3VwSURcIjpcIjU2NGNmNjVmLTEzMTItNDhkMS1iOThjLThkYzE1NGNlZmM1OVwiLFwiRGFzaGJvYXJkSXRlbUlEXCI6XCJjMTgzNTNhMi05N2QwLTQyYzMtOWI2NC1iOWQxZGFlMDkyYjJcIn0se1wiVXNlcnNHcm91cERhc2hib2FyZE1lbnVJdGVtSURcIjpcIjkyNjY1ZDg0LTMyZGEtNDNmMS04YWYyLWM3MjY0ODc2NGZlNVwiLFwiRGFzaGJvYXJkTWVudUl0ZW1OYW1lXCI6XCLYqti12YbZitmB2KfYqiDYp9mE2YLYp9im2YXYqVwiLFwiUm91dGVQYXRoXCI6XCJkeW5hbWljVGFibGVcIixcIlVzZXJzR3JvdXBJRFwiOlwiNTY0Y2Y2NWYtMTMxMi00OGQxLWI5OGMtOGRjMTU0Y2VmYzU5XCIsXCJEYXNoYm9hcmRJdGVtSURcIjpcIjIxYjg4MjBkLTZiYTItNDc5MS1hOWE0LWUwZmFhOWUwOTg3YVwifSx7XCJVc2Vyc0dyb3VwRGFzaGJvYXJkTWVudUl0ZW1JRFwiOlwiMDk2M2FlM2ItYTg4NC00MjNjLWFkYjEtY2Q1YzYwNmExMWI1XCIsXCJEYXNoYm9hcmRNZW51SXRlbU5hbWVcIjpcItin2YTYrdi22YjYsSDYp9mE2YrZiNmF2YpcIixcIlJvdXRlUGF0aFwiOlwiZHluYW1pY1RhYmxlXCIsXCJVc2Vyc0dyb3VwSURcIjpcIjU2NGNmNjVmLTEzMTItNDhkMS1iOThjLThkYzE1NGNlZmM1OVwiLFwiRGFzaGJvYXJkSXRlbUlEXCI6XCJjYzhlN2U0MC02YjI2LTQ2ZGUtODE0Zi1kZDc2ODY5NTY5NTlcIn0se1wiVXNlcnNHcm91cERhc2hib2FyZE1lbnVJdGVtSURcIjpcIjJiYjRmZmJmLTc3NGQtNGU3My05NzE0LWUwYjBkNzA5NDY2Y1wiLFwiRGFzaGJvYXJkTWVudUl0ZW1OYW1lXCI6XCLZgdin2KrZiNix2Kkg2YXYqNmK2LnYp9iqXCIsXCJSb3V0ZVBhdGhcIjpcImR5bmFtaWNSZXBvcnRcIixcIlVzZXJzR3JvdXBJRFwiOlwiNTY0Y2Y2NWYtMTMxMi00OGQxLWI5OGMtOGRjMTU0Y2VmYzU5XCIsXCJEYXNoYm9hcmRJdGVtSURcIjpcImQ0ZTEyOGFiLThiYmItNGE5Yy1hYWQwLTg2ZWM1ZmE2MzY4YlwifV0iLCJhdWQiOiJBbGwifQ.jrgR_hGcLY26bfHf58Vc3lLgQwnkY8wzkKfJpqvAQ_A");
  const [orderType, setOrderType] = useState(-1);
const [nodeID, setNodeID]  = useState("1421D86A-0043-441B-988A-E7CFAD6273A7");

  // Set Default Installation Path
  useEffect(() => {
    if (!setupResponse) return;

    const nodeId = setupResponse?.nodeID ?? setupResponse?.nodeId ?? "default";
    const defaultPath =
      setupResponse?.installPath || `${DEFAULT_INSTALL_ROOT}\\Node_${nodeId}`;

    setInstallPath(defaultPath);
    const assignedPrinters =
    setupResponse?.printers ??
    setupResponse?.assignedPrinters;

  const _hasAssignedPrinters = Array.isArray(assignedPrinters)
    ? assignedPrinters.length > 0
    : !!assignedPrinters;
    setHasAssignedPrinters(_hasAssignedPrinters)
  }, [setupResponse]);

  // Check Disk Space with Cancellation Handling
  const checkDiskSpace = useCallback(async (targetPath, signal) => {
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

      if (signal.aborted) return;

      if (!result?.success) {
        throw new Error(result?.error || "Failed to check disk space.");
      }

      setDiskSpace(result);
    } catch (err) {
      if (signal.aborted) return;

      console.error("❌ Disk space check failed:", err);
      setDiskSpace(null);
      setPathError(err?.message || "Unable to check available disk space.");
    } finally {
      if (!signal.aborted) {
        setCheckingSpace(false);
      }
    }
  }, []);

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
        label: "Node configuration",
        checked:
          !!nodeID &&
          !!orderType,
      },
      {
        id: "clientKey",
        label: "Client configuration",
        checked: !!token,
      },
      {
        id: "path",
        label: "Installation path",
        checked: !!installPath && !pathError,
      },
      {
        id: "disk",
        label: "Disk space",
        checked: !!diskSpace && !checkingSpace && hasEnoughSpace,
      },
      {
      id: "printers",
      label: "Printers assigned",
      checked: hasAssignedPrinters,
    },
    ];
  }, [setupResponse, installPath, pathError, diskSpace, checkingSpace, hasEnoughSpace]);

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
          <span className="progress-title">Review Progress</span>
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
        <div className="section-title">CHECKLIST</div>
        <div className="section-divider" />
        <div className="section-content">
          {pendingSteps.length === 0 ? (
            <span className="empty-text">(empty)</span>
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
        <div className="section-title">{localization?.setup?.reviewStep?.titleDONE||"DONE"}</div>
        <div className="section-divider" />
        <div className="section-content">
          {completedSteps.length === 0 ? (
            <span className="empty-text">(empty)</span>
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
          {localization?.setup?.cancel??"Cancel"}
        </button>
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={
            loading || checkingSpace || !allChecksCompleted || progress > 0
          }
          className="btn-install"
        >
          
          {loading ?(localization?.setup?.installing??"Installing...")  :
          (localization?.setup?.install?? "Install Service")
         }
        </button>
      </div>
    </div>
  );
};

export default ReviewStep;