export const DEFAULT_PORTAL_URL = "https://portal.ihs.com";

export const DEFAULT_INSTALL_PATH = "C:\\Program Files\\IHS Client Node";

export const DEFAULT_PORT = 8080;

export const STEPS_CONFIG = [
  { key: "InstallationLocation", label: "Installation Location" },
  { key: "PRINTER", label: "Printer Setup" },
  { key: "PORTAL", label: "Portal Setup" },
  { key: "REVIEW", label: "Review" },
  { key: "COMPLETE", label: "Complete" },
];
export const getStepByKey = (key) => {
  const result = STEPS_CONFIG.find((step) => step.key === key) ?? null;

  return result;
};
export const getStepIndexByKey = (key) => {
  return STEPS_CONFIG.findIndex((step) => step.key === key);
};
