// Runs after electron-builder packs the app, before the .dmg/.zip are made.
// Adds a free "ad-hoc" signature so Apple Silicon Macs don't call the app "damaged".
const { execSync } = require("child_process");
const path = require("path");

exports.default = async function (context) {
  if (context.electronPlatformName !== "darwin") return;
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${appName}.app`);
  console.log("Ad-hoc signing:", appPath);
  execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: "inherit" });
};
