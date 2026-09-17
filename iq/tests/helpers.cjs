/** Общее для всех проверок: загрузка браузерных модулей и учёт ошибок. */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function load(files) {
  const sandbox = {};
  for (const file of files) new Function("window", fs.readFileSync(path.join(ROOT, file), "utf8"))(sandbox);
  return sandbox;
}

function reporter() {
  let failed = 0;
  const ok = (name, condition, detail) => {
    if (!condition) failed++;
    console.log((condition ? "ok   " : "ПЛОХО ") + name + (condition || !detail ? "" : "\n      " + detail));
  };
  const eq = (name, got, expected) =>
    ok(name, JSON.stringify(got) === JSON.stringify(expected), "получили " + JSON.stringify(got) + ", ждали " + JSON.stringify(expected));
  const done = () => {
    console.log(failed ? failed + " проверок не прошло" : "все проверки набора прошли");
    process.exit(failed ? 1 : 0);
  };
  return { ok, eq, done };
}

module.exports = { load, reporter };
