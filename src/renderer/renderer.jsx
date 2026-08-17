import React, { useContext, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { StepIndicator } from "./components/StepIndicator";
import { PortalStep } from "./components/PortalStep";
import { ReviewStep } from "./components/ReviewStep";
import { CompleteStep } from "./components/CompleteStep";
import { PrinterStep } from "./components/PrinterStep";
import { useSetup } from "./hooks/AppHooks/useStep.js";

import "./styles/App.css";
import LanguageSelector from "./components/LanguageSelector";
import Language, { LanguageContext } from "./context/Language.jsx";

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

    handlePrinterNext,
    handleSetupComplete,
    handleInstall,
    handleReinstall,
    handleCancel,
    handlePortalNext,
  } = useSetup();

  useEffect(() => {
    window.document.dir = Right ? "rtl" : "ltr";
  }, [Right]);
  // ==========================================================
  // RENDER CURRENT STEP
  // ==========================================================

  const renderStep = () => {
    switch (currentStep) {
      // ========================================================
      // STEP 1
      // ========================================================

      case "printer":
        return (
          <PrinterStep
            printerConfig={printerConfig}
            onNext={handlePrinterNext}
            loading={loading}
            error={error}
          />
        );

      // ========================================================
      // STEP 2
      // ========================================================

      case "portal":
        return (
          <PortalStep
            portalUrl={portalUrl}
            printerConfig={printerConfig}
            onSetupComplete={handleSetupComplete}
            onCancel={handleCancel}
            loading={loading}
            error={error}
            progress={progress}
            handlePortalNext={handlePortalNext}
          />
        );

      // ========================================================
      // STEP 3
      // ========================================================

      case "review":
        return (
          <ReviewStep
            setupResponse={setupResponse}
            printerConfig={printerConfig}
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

      case "complete":
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
        return <div>Loading...</div>;
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="setup-container">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="setup-header">
        <div className="logo-container">
          <img src="/assets/icons/icon.svg" alt="IHS Portal" className="logo" />

          <h1>IHS Portal Setup</h1>
          <LanguageSelector open={true} />
        </div>

        <StepIndicator currentStep={currentStep} steps={steps} />
      </header>

      {/* ======================================================
          CONTENT
          ====================================================== */}

      <main className="setup-content">{renderStep()}</main>

      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer className="setup-footer">
        <div className="footer-info">
          <span>Version 1.0.0</span>

          <span>© 2024 IHS Technologies</span>

          {setupResponse?.sessionId && (
            <span>Session: {setupResponse.sessionId.substring(0, 8)}</span>
          )}
        </div>
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
