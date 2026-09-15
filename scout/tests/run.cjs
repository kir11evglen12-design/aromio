/**
 * Every Scout suite:  npm test   (from scout/)
 *
 * Pure Node, no dependencies. The analysis engine is testable offline and
 * that is deliberate — the exchange and the messenger can be down, the
 * arithmetic still has to be right.
 */
const { execFileSync } = require("child_process");
const path = require("path");

const suites = ["ta.test.cjs", "setups.test.cjs", "service.test.cjs"];
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
