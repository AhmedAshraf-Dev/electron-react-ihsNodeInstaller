import React, { useContext, useEffect, useState } from "react";
import appsettings from "../../../printer-project/Worker/appsettings.json";
import "./PrinterStep.css";
import { LanguageContext } from "../context/Language";

export function PrinterStep({ printerConfig, onNext, loading, error }) {
  const [installPath, setInstallPath] = useState(
    printerConfig?.installPath || "",
  );
  const { localization } = useContext(LanguageContext);

  const [logoPath, setLogoPath] = useState(printerConfig?.logoPath || "");

  const [testingPrinter, setTestingPrinter] = useState(null);

  const [printerTestResults, setPrinterTestResults] = useState({});
  const [printers, setPrinters] = useState([]);
  const [loadingPrinters, setLoadingPrinters] = useState(true);

  useEffect(() => {
    const loadPrinters = async () => {
      try {
        setLoadingPrinters(true);

        if (!window.setupAPI?.getPrinters) {
          throw new Error("Printer API is not available.");
        }

        const result = await window.setupAPI.getPrinters();

        console.log("🖨️ Connected printers:", result);

        setPrinters(result || []);
      } catch (err) {
        console.error("Failed to load printers:", err);
        setPrinters([]);
      } finally {
        setLoadingPrinters(false);
      }
    };

    loadPrinters();
  }, []);
  // ==========================================================
  // PRINTER CONFIGURATION
  // ==========================================================

  const configuredPrinters =
    printerConfig?.printers || appsettings.Printing.Printers;

  // ==========================================================
  // TEST PRINTER
  // ==========================================================

  const handleTestPrinter = async (printer, printerId) => {
    if (!printer?.PrinterName) {
      return;
    }

    try {
      setTestingPrinter(printerId);

      setPrinterTestResults((previous) => ({
        ...previous,
        [printerId]: null,
      }));

      if (!window.setupAPI?.testPrinter) {
        throw new Error("Printer testing is not available.");
      }

      console.log("🖨️ Testing printer:", printer);

      // IMPORTANT:
      // Your existing Electron API expects a STRING.
      const result = await window.setupAPI.testPrinter(printer.PrinterName);

      console.log("🖨️ Printer test result:", result);

      setPrinterTestResults((previous) => ({
        ...previous,
        [printerId]: {
          success: !!result?.success,
          message: result?.success
            ? "Printer test completed successfully."
            : result?.error || "Failed to test the printer.",
        },
      }));
    } catch (err) {
      console.error("Failed to test printer:", err);

      setPrinterTestResults((previous) => ({
        ...previous,
        [printerId]: {
          success: false,
          message: err.message || "Failed to test the printer.",
        },
      }));
    } finally {
      setTestingPrinter(null);
    }
  };

  // ==========================================================
  // SELECT INSTALLATION DIRECTORY
  // ==========================================================

  const handleSelectDirectory = async () => {
    try {
      if (!window.setupAPI?.selectDirectory) {
        return;
      }

      const result = await window.setupAPI.selectDirectory();

      console.log("📁 Selected directory:", result);

      if (!result.canceled && result.path) {
        setInstallPath(result.path);
      }
    } catch (err) {
      console.error("Failed to select directory:", err);
    }
  };

  // ==========================================================
  // SELECT LOGO
  // ==========================================================

  const handleSelectLogo = async () => {
    try {
      if (!window.setupAPI?.selectLogo) {
        return;
      }

      const result = await window.setupAPI.selectLogo();

      console.log("🖼️ Selected logo:", result);

      if (!result.canceled && result.path) {
        setLogoPath(result.path);
      }
    } catch (err) {
      console.error("Failed to select logo:", err);
    }
  };

  // ==========================================================
  // CONTINUE
  // ==========================================================

  const handleSubmit = (event) => {
    event.preventDefault();

    onNext({
      printers: configuredPrinters,
      installPath,
      logoPath,
    });
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="printer-step">
      <div className="printer-header">
        <h2>{localization?.PrinterStep?.title || "Printer Configuration"}</h2>

        <p>
          {localization?.PrinterStep?.desc ||
            "Test the configured printers and configure the installation location and logo."}
        </p>
      </div>

      {error && <div className="error-box">⚠️ {error}</div>}

      <form onSubmit={handleSubmit}>
        {/* ==================================================
            CONFIGURED PRINTERS
            ================================================== */}

        <div className="form-group">
          <label>
            {localization?.PrinterStep?.formLabel || "Configured Printers"}
          </label>

          {Object.keys(configuredPrinters).length === 0 ? (
            <div className="no-printers">
              {localization?.PrinterStep?.noPrinters ||
                "No printers were configured."}
            </div>
          ) : (
            <div className="configured-printers">
              {Object.keys(configuredPrinters).map((key, index) => {
                const printer = configuredPrinters?.[key]; //arr
                const printerId = `${printer.PrinterName}-${index}`;

                const isTesting = testingPrinter === printerId;

                const testResult = printerTestResults[printerId];

                return (
                  <div key={printerId} className="configured-printer">
                    {/* Printer information */}

                    <div className="configured-printer-info">
                      <div className="printer-name">🖨️ {key}</div>
                    </div>

                    {/* Test button */}

                    <button
                      type="button"
                      className="btn btn-secondary test-printer-btn"
                      onClick={() => handleTestPrinter(printer, printerId)}
                      disabled={loading || testingPrinter !== null}
                    >
                      {isTesting
                        ? localization?.PrinterStep?.testingButtonText ||
                          "Testing..."
                        : localization?.PrinterStep?.testButtonText ||
                          "Test Printer"}
                    </button>

                    {/* Test result */}

                    {testResult && (
                      <div
                        className={
                          testResult.success
                            ? "printer-test-success"
                            : "printer-test-error"
                        }
                      >
                        {testResult.success ? "✓" : "⚠️"} {testResult.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ==================================================
            INSTALLATION LOCATION
            ================================================== */}

        <div className="form-group">
          <label>Installation Location</label>

          <div className="path-input">
            <input
              type="text"
              value={installPath}
              readOnly
              placeholder="Select installation location"
              disabled={loading}
            />

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSelectDirectory}
              disabled={loading}
            >
              Browse
            </button>
          </div>
        </div>

        {/* ==================================================
            LOGO
            ================================================== */}

        <div className="form-group">
          <label>Logo</label>

          <div className="path-input">
            <input
              type="text"
              value={logoPath}
              readOnly
              placeholder="Select logo"
              disabled={loading}
            />

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSelectLogo}
              disabled={loading}
            >
              Browse
            </button>
          </div>
        </div>

        {/* ==================================================
            ACTION
            ================================================== */}

        <div className="printer-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || configuredPrinters.length === 0}
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

export default PrinterStep;
