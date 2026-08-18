import React, { useContext, useEffect, useState } from "react";
import appsettings from "../../../printer-project/Worker/appsettings.json";
import "./PrinterStep.css";
import { LanguageContext } from "../context/Language";

export function PrinterStep({ setupResponse, onNext, loading, error }) {
 
  const { localization } = useContext(LanguageContext);

 

  const [testingPrinter, setTestingPrinter] = useState(null);

  const [printerTestResults, setPrinterTestResults] = useState(setupResponse?.printerTestResults||{});
  const [printers, setPrinters] = useState([]);
  const [loadingPrinters, setLoadingPrinters] = useState(true);
  const [selectedPrinterNames, setSelectedPrinterNames] = useState({});

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
    setupResponse?.printers || appsettings?.Printing?.Printers?.saleInvoice;

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

 

  // ==========================================================
  // CONTINUE
  // ==========================================================
const [formErrors, setFormErrors] = useState({});
 const handleSubmit = (event) => {
  event.preventDefault();

  const validationErrors = validateForm();

  if (Object.keys(validationErrors).length > 0) {
    setFormErrors(validationErrors);
    return;
  }

  setFormErrors({});

  const printersWithSelection = configuredPrinters.map(
    (printer, index) => {
      const printerId = `${
        printer?.PrinterName || printer?.printerLabel
      }-${index}`;

      const selectedPrinterName =
        selectedPrinterNames[printerId] ||
        printer?.PrinterName ||
        "";

      return {
        ...printer,
        PrinterName: selectedPrinterName,
      };
    },
  );

  onNext({
    printers: printersWithSelection,
    printerTestResults:printerTestResults
  });
};

  // ==========================================================
  // RENDER
  // ==========================================================
const validateForm = () => {
  const validationErrors = {};

  // 1. Installation path validation
 

  // 2. Configured printers & testing validation
  if (!configuredPrinters || configuredPrinters.length === 0) {
    validationErrors.printers = "At least one printer is required.";
  } else {
    configuredPrinters.forEach((printer, index) => {
      const printerId = `${printer?.PrinterName || printer?.printerLabel}-${index}`;

      const selectedPrinter =
        selectedPrinterNames[printerId] ||
        printer?.PrinterName ||
        "";

      if (!selectedPrinter) {
        validationErrors[`printer_${printerId}`] =
          `Please select a printer for ${
            printer?.printerLabel || `Printer ${index + 1}`
          }.`;
      } else if (!printerTestResults[printerId]?.success) {
        // Checks if printer was tested and succeeded
        validationErrors[`test_${printerId}`] =
          `Please run a successful test for ${
            printer?.printerLabel || `Printer ${index + 1}`
          } before proceeding.`;
      }
    });
  }

  return validationErrors;
};
  return (
    <div className="printer-step">
      <div className="printer-header">
        <h2>{localization?.setup?.printerStep?.title || "Printer Configuration"}</h2>

        <p>
          {localization?.setup?.PrinterStep?.desc ||
            "Test the configured printers."}
        </p>
      </div>

      {error && <div className="error-box">⚠️ {error}</div>}

      <form onSubmit={handleSubmit}  className="printer-form">
         
        {/* ==================================================
            CONFIGURED PRINTERS
            ================================================== */}

        <div className="form-group">
  <label>
    {localization?.setup?.PrinterStep?.formLabel ||
      "Configured Printers"}
  </label>

  {configuredPrinters?.length === 0 ? (
    <div className="no-printers">
      {localization?.setup?.PrinterStep?.noPrinters ||
        "No printers were configured."}
    </div>
  ) : (
    <div className="configured-printers">
      {configuredPrinters.map((printer, index) => {
        const printerId = `${printer?.PrinterName || printer?.printerLabel}-${index}`;

        const selectedPrinterName =
          selectedPrinterNames[printerId] ||
          printer?.PrinterName ||
          printers?.[0]?.PrinterName ||
          "";

        const isTesting = testingPrinter === printerId;

        const testResult = printerTestResults[printerId];
const haveTest = printerTestResults[printer?.PrinterName ];
        return (
          <div
            key={printerId}
            className="configured-printer"
          >
            {/* ==================================================
                PRINTER INFORMATION
                ================================================== */}

            <div className="configured-printer-info">
              <div className="printer-name">
                🖨️ {printer?.PrinterLabel || "Printer"}
              </div>
            </div>

            {/* ==================================================
                PRINTER SELECT + TEST
                ================================================== */}

            <div className="printer-selector">

              <select
                className="form-select"
                value={selectedPrinterName}
                onChange={(e) => {
                  setSelectedPrinterNames((previous) => ({
                    ...previous,
                    [printerId]: e.target.value,
                  }));

                  // Clear previous test result when printer changes
                  setPrinterTestResults((previous) => ({
                    ...previous,
                    [printerId]: null,
                    
                  }));
                }}
                disabled={
                  loading ||
                  loadingPrinters ||
                  testingPrinter !== null
                }
              >
                <option value="">
                  {localization?.setup?.PrinterStep?.selectPrinter ||
                    "Select printer"}
                </option>

                {printers?.map((sysPrinter, printerIndex) => (
                  <option
                    key={sysPrinter?.name || printerIndex}
                    value={sysPrinter?.name || ""}
                  >
                    {sysPrinter?.displayName ||
                      sysPrinter?.name ||
                      "Unknown Printer"}
                  </option>
                ))}
              </select>

              {/* TEST BUTTON */}

              <button
                type="button"
                className="btn btn-secondary test-printer-btn"
                onClick={() => {
                  if (!selectedPrinterName) {
                    return;
                  }

                  handleTestPrinter(
                    {
                      ...printer,
                      PrinterName: selectedPrinterName,
                    },
                    printerId
                  );
                }}
                disabled={
                  loading ||
                  loadingPrinters ||
                  testingPrinter !== null ||
                  !selectedPrinterName
                }
              >
                {isTesting
                  ? localization?.setup?.PrinterStep
                      ?.testingButtonText || "Testing..."
                  : localization?.setup?.PrinterStep
                      ?.testButtonText || "Test"}
              </button>
            </div>

            {/* ==================================================
                TEST RESULT
                ================================================== */}

            {testResult && (
              <div
                className={
                  testResult.success
                    ? "printer-test-success"
                    : "printer-test-error"
                }
              >
                {testResult.success ? "✓" : "⚠️"}{" "}
                {testResult.message}
              </div>
            )}
          </div>
        );
      })}
    </div>
  )}
</div>

     

   

        {/* ==================================================
            ACTION
            ================================================== */}
   {Object.keys(formErrors).length > 0 && (
    <div className="error-box">
      {localization?.setup?.required ||
      "⚠️ Please complete all required fields before continuing."}
      
    </div>
  )}
        <div className="printer-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || configuredPrinters.length === 0}
          >
            {localization?.setup?.continue ||
                "Continue"}
            
          </button>
        </div>
      
      </form>
    </div>
  );
}

export default PrinterStep;
