const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const source = path.join(root, "renderer");
const destination = path.join(root, "landing-page", "public", "app");

fs.mkdirSync(destination, { recursive: true });
for (const file of ["index.html", "renderer.js", "style.css"]) {
  fs.copyFileSync(path.join(source, file), path.join(destination, file));
}
console.log("[sync:web-app] Desktop renderer copied to landing-page/public/app");
