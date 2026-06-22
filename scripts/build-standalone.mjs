import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(projectRoot, "dist");
const outputPath = join(projectRoot, "YARA.html");

let html = await readFile(join(distDir, "index.html"), "utf8");
const stylesheet = html.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
const script = html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);

if (!stylesheet || !script) {
  throw new Error("Could not find the production CSS or JavaScript bundle.");
}

const assetPath = (url) => join(distDir, url.replace(/^\//, ""));
const css = await readFile(assetPath(stylesheet[1]), "utf8");
const javascript = (await readFile(assetPath(script[1]), "utf8")).replace(/<\/script/gi, "<\\/script");

html = html
  .replace(stylesheet[0], () => `<style>${css}</style>`)
  .replace(script[0], () => `<script type="module">${javascript}</script>`);

await writeFile(outputPath, html, "utf8");
console.log(`Standalone website created: ${outputPath}`);
