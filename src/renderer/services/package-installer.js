import fs from "node:fs";
import path from "node:path";
import extract from "extract-zip";

export async function installPackage({ zipPath, installPath }) {
  if (!zipPath) {
    throw new Error("ZIP package path is required.");
  }

  if (!installPath) {
    throw new Error("Installation path is required.");
  }

  if (!fs.existsSync(zipPath)) {
    throw new Error(`Installation package was not found: ${zipPath}`);
  }

  // Create installation directory
  fs.mkdirSync(installPath, {
    recursive: true,
  });

  console.log("📦 Installing package");
  console.log("📦 ZIP:", zipPath);
  console.log("📁 Target:", installPath);

  await extract(zipPath, {
    dir: installPath,
  });

  console.log("✅ Package extracted successfully");

  return {
    success: true,
    installPath,
  };
}
