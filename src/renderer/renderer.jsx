import React, { useContext, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { StepIndicator } from "./components/StepIndicator";
import { PortalStep } from "./components/PortalStep";
import { ReviewStep } from "./components/ReviewStep";
import { CompleteStep } from "./components/CompleteStep";
import { PrinterStep } from "./components/PrinterStep";
import { useSetup } from "./hooks/AppHooks/useStep.js";

import "./styles/App.css";
// import "../index.css";
import LanguageSelector from "./components/LanguageSelector";
import Language, { LanguageContext } from "./context/Language.jsx";
import { getStepIndexByKey } from "./hooks/AppHooks/setup/constants.js";
import InstallationLocation from "./components/InstallationLocation.jsx";

function App() {
  const { Right, localization } = useContext(LanguageContext);

  const [routes, setRoutes] = useState("");
  const [open, setopen] = useState(false);
  const {
    currentStep,

    printerConfig,
    setupResponse,

    serviceStatus,
    loading,
    error,
    progress,

    portalUrl,

    steps,

    handleNextStep,
    handleSetupComplete,
    handleInstall,
    handleReinstall,
    handleCancel,

    handlePreviousStep,
  } = useSetup();

  useEffect(() => {
    window.document.dir = Right ? "rtl" : "ltr";
  }, [Right]);
  // ==========================================================
  // RENDER CURRENT STEP
  // ==========================================================

  const renderStep = () => {
    switch (currentStep?.key) {
      // ========================================================
      // STEP 1
      // ========================================================

      case "PRINTER":
        return (
          <PrinterStep
            setupResponse={setupResponse}
            onNext={handleNextStep}
            loading={loading}
            error={error}
          />
        );
      case "InstallationLocation":
        return (
          <InstallationLocation
            setupResponse={setupResponse}
            onNext={handleNextStep}
            loading={loading}
            error={error}
          />
        );

      // ========================================================
      // STEP 2
      // ========================================================

      case "PORTAL":
        return (
          <PortalStep
            portalUrl={portalUrl}
            setupResponse={setupResponse}
            onSetupComplete={handleSetupComplete}
            onCancel={handleCancel}
            loading={loading}
            error={error}
            progress={progress}
            handlePortalNext={handleNextStep}
          />
        );

      // ========================================================
      // STEP 3
      // ========================================================

      case "REVIEW":
        return (
          <ReviewStep
            setupResponse={setupResponse}
            onInstall={handleInstall}
            onCancel={handleCancel}
            loading={loading}
            error={error}
            progress={progress}
          />
        );

      // ========================================================
      // STEP 4
      // ========================================================

      case "COMPLETE":
        return (
          <CompleteStep
            setupResponse={setupResponse}
            printerConfig={printerConfig}
            serviceStatus={serviceStatus}
            onFinish={() => window.close()}
            onReinstall={handleReinstall}
          />
        );

      default:
        return <div>{localization?.setup?.loading || "Loading..."}</div>;
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================
  const isStepBackVisible = getStepIndexByKey(currentStep?.key) > 0;

  return (
    <div className="setup-container flex h-screen min-h-0 flex-col">
      {/* HEADER */}
      <header className="setup-header shrink-0">
        <div className="header-top-bar">
          <div className="brand-group">
            <div className="logo-wrapper">
              <img
                src="/assets/icons/icon.svg"
                alt="IHS Portal"
                className="logo"
              />
            </div>

            <div className="brand-titles">
              <h1 className="brand-title">
                {localization?.setup?.title || "IHS Portal Setup"}
              </h1>

              <p className="brand-subtitle">
                {localization?.setup?.subtitle ||
                  "System Configuration & Onboarding"}
              </p>
            </div>
          </div>

          <div className="header-actions">
            <LanguageSelector open={true} />

            <button
              type="button"
              className="btn-back-modern"
              onClick={handlePreviousStep}
              aria-label="Go back to previous step"
              disabled={!isStepBackVisible}
            >
              <span className="back-arrow">{Right ? "→" : "←"}</span>

              <span className="back-text">
                {localization?.setup?.back || "Back"}
              </span>
            </button>
          </div>
        </div>

        <div className="header-stepper-container">
          <StepIndicator
            currentStep={currentStep}
            steps={steps}
            handlePreviousStep={handlePreviousStep}
          />
        </div>
      </header>

      {/* SCROLLABLE CONTENT */}
      <main className="setup-content min-h-0 flex-1 overflow-y-auto">
        <div className="content-card">{renderStep()}</div>
      </main>

      {/* FOOTER */}
      <footer className="setup-footer shrink-0">
        <div className="footer-meta">
          <span className="footer-badge">v1.0.0</span>

          {setupResponse?.sessionId && (
            <span className="footer-session">
              <span className="dot-indicator"></span>
              {localization?.setup?.session || "Session:"}{" "}
              <code>{setupResponse.sessionId.substring(0, 8)}</code>
            </span>
          )}
        </div>

        <p className="footer-copyright">
          {localization?.setup?.copyright ||
            "© 2024 IHS Technologies. All rights reserved."}
        </p>
      </footer>
    </div>
  );
}

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <Language>
      <App />
    </Language>,
  );
}
