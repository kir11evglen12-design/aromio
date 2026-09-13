/**
 * Runs every wallet suite:  node wallet/tests/run.cjs
 *
 * Pure Node, no dependencies — the modules are plain browser scripts, so a
 * test just evaluates them against a stub `window`.
 */
const { execFileSync } = require("child_process");
const path = require("path");

const suites = ["qr.test.cjs", "vault.test.cjs", "store.test.cjs"];
let failed = 0;

for (const suite of suites) {
  console.log("\n=== " + suite + " ===");
  try {
    execFileSync(process.execPath, [path.join(__dirname, suite)], { stdio: "inherit" });
  } catch (e) {
    failed++;
  }
}

console.log(failed ? "\n" + failed + " suite(s) failed" : "\nall suites passed");
process.exit(failed ? 1 : 0);
