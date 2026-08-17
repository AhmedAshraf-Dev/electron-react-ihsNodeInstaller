export const STEPS = {
  PRINTER: "printer",
  PORTAL: "portal",
  REVIEW: "review",
  COMPLETE: "complete",
};

export const DEFAULT_PORTAL_URL = "https://portal.ihs.com";

export const DEFAULT_INSTALL_PATH = "C:\\Program Files\\IHS Client Node";

export const DEFAULT_PORT = 8080;

export const STEPS_CONFIG = [
  { key: STEPS.PRINTER, label: "Printer Setup" },
  { key: STEPS.PORTAL, label: "Portal Setup" },
  { key: STEPS.REVIEW, label: "Review" },
  { key: STEPS.COMPLETE, label: "Complete" },
];
