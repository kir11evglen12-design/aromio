/**
 * Собирает тест в один файл: node iq/build-single.cjs
 *
 * Многофайловая версия — та, которую читают и правят; этот файл — тот,
 * который выкладывают. Стили и скрипты вставляются внутрь в том же
 * порядке, в каком их подключает index.html, так что результат работает
 * без сервера и без сборщика — хоть с флешки.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "index-single.html");
const SCRIPTS = ["config.js", "figures.js", "tasks.js", "score.js", "access.js", "app.js"];

const read = name => fs.readFileSync(path.join(ROOT, name), "utf8");

let html = read("index.html");

html = html.replace('<link rel="stylesheet" href="styles.css">', "<style>\n" + read("styles.css") + "\n</style>");

const tags = SCRIPTS.map(name => `<script src="${name}"></script>`).join("\n");
if (!html.includes(tags)) {
  console.error("build-single: index.html подключает скрипты не в том порядке — поправьте SCRIPTS.");
  process.exit(1);
}
html = html.replace(tags, SCRIPTS.map(name => `<!-- ${name} -->\n<script>\n${read(name)}\n</script>`).join("\n"));

/* Закрывающий тег внутри вставленного кода оборвал бы блок раньше времени. */
const closers = (html.match(/<\/script>/g) || []).length;
if (closers !== SCRIPTS.length) {
  console.error(`build-single: ожидалось ${SCRIPTS.length} закрывающих тегов script, найдено ${closers}`);
  process.exit(1);
}

fs.writeFileSync(OUT, html);

/* И в опубликованный сайт. Сборка витрины очищает docs/, поэтому этот
   шаг идёт после неё — см. package.json. */
const SITE = path.join(ROOT, "..", "docs", "iq");
fs.mkdirSync(SITE, { recursive: true });
fs.writeFileSync(path.join(SITE, "index.html"), html);

const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`iq/index-single.html — ${kb} KB, ${SCRIPTS.length} модулей и стили внутри`);
console.log("docs/iq/index.html — тот же файл, для GitHub Pages");
