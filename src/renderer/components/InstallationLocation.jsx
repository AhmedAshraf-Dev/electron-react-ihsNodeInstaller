import React, { useContext, useEffect, useState } from "react";
import appsettings from "../../../printer-project/Worker/appsettings.json";
import "./InstallationLocation.css";
import { LanguageContext } from "../context/Language";

export function InstallationLocation({ setupResponse, onNext, loading, error }) {
  const [installPath, setInstallPath] = useState(
    setupResponse?.installPath || "",
  );
  const { localization } = useContext(LanguageContext);

 


 
 


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



  onNext({

    installPath,
  });
};

  // ==========================================================
  // RENDER
  // ==========================================================
const validateForm = () => {
  const validationErrors = {};

  // 1. Installation path validation
  if (!installPath?.trim()) {
    validationErrors.installPath = "Installation location is required.";
  }

  

  return validationErrors;
};
  return (
    <div className="printer-step">
      <div className="printer-header">
        <h2>{localization?.setup?.installationLocationStep?.title || "Install Configuration"}</h2>

        <p>
          {localization?.setup?.installationLocationStep?.desc ||
            "configure the installation location."}
        </p>
      </div>

      {error && <div className="error-box">⚠️ {error}</div>}

      <form onSubmit={handleSubmit}  className="printer-form">
         


        {/* ==================================================
            INSTALLATION LOCATION
            ================================================== */}

        <div className="form-group">
          <label>{localization?.setup?.installationLocation ||
                "Installation Location"}</label>

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
              {localization?.setup?.browse ||
                "Browse"}
              
            </button>
          </div>
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
            disabled={loading }
          >
            {localization?.setup?.continue ||
                "Continue"}
            
          </button>
        </div>
      
      </form>
    </div>
  );
}

export default InstallationLocation;
