/**
 * Все проверки теста:  node iq/tests/run.cjs
 *
 * Чистый Node, без зависимостей: модули — обычные браузерные скрипты,
 * поэтому проверка просто выполняет их с подставным `window`.
 */
const { execFileSync } = require("child_process");
const path = require("path");

const suites = ["figures.test.cjs", "tasks.test.cjs", "score.test.cjs", "access.test.cjs"];
let failed = 0;

for (const suite of suites) {
  console.log("\n=== " + suite + " ===");
  try {
    execFileSync(process.execPath, [path.join(__dirname, suite)], { stdio: "inherit" });
  } catch (e) {
    failed++;
  }
}

console.log(failed ? "\n" + failed + " набор(а) проверок не прошли" : "\nвсе проверки прошли");
process.exit(failed ? 1 : 0);
