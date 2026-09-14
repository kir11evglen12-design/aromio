/**
 * Bakes the wallet into one self-contained file: node wallet/build-single.cjs
 *
 * The multi-file version is what you read and edit; this is what you send to
 * somebody. Styles and scripts are inlined in the order index.html loads
 * them, so the result needs no server, no build step and no network.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "meridian.html");

const SCRIPTS = ["wordlist.js", "qr.js", "vault.js", "market.js", "wallet.js", "ui.js", "screens.js", "app.js"];

const read = name => fs.readFileSync(path.join(ROOT, name), "utf8");

let html = read("index.html");

/* Inline the stylesheet where its <link> sits. */
html = html.replace(
  '<link rel="stylesheet" href="styles.css">',
  "<style>\n" + read("styles.css") + "\n</style>"
);

/* Replace the whole run of <script src> tags with their contents. */
const scriptTags = SCRIPTS.map(name => `<script src="${name}"></script>`).join("\n");
const inlined = SCRIPTS.map(name =>
  `<!-- ${name} -->\n<script>\n${read(name)}\n</script>`
).join("\n");

if (!html.includes(scriptTags)) {
  console.error("index.html no longer loads the scripts in the expected order — update SCRIPTS.");
  process.exit(1);
}
html = html.replace(scriptTags, inlined);

/* A closing </script> anywhere inside inlined source would end the block early. */
const stray = html.match(/<\/script>/g).length;
if (stray !== SCRIPTS.length) {
  console.error(`expected ${SCRIPTS.length} closing script tags, found ${stray}`);
  process.exit(1);
}

fs.writeFileSync(OUT, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`meridian.html — ${kb} KB, ${SCRIPTS.length} modules + styles inlined`);
