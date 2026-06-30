import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const pdfDir = path.join(process.cwd(), "source-epds");
const outDir = path.join(process.cwd(), "public", "annotations");

mkdirSync(outDir, { recursive: true });
for (const file of readdirSync(outDir).filter((name) => name.endsWith(".png"))) {
  rmSync(path.join(outDir, file));
}

const pages = new Map();
for (const file of readdirSync(dataDir).filter((name) => name.endsWith(".json"))) {
  const product = JSON.parse(await readFile(path.join(dataDir, file), "utf8"));
  for (const figure of product.carbon) {
    const provenance = figure.provenance;
    if (!provenance) continue;
    const key = `${provenance.sourcePdf}::${provenance.page}`;
    pages.set(key, { sourcePdf: provenance.sourcePdf, page: provenance.page });
  }
}

for (const { sourcePdf, page } of pages.values()) {
  const input = path.join(pdfDir, sourcePdf);
  const outputBase = `${annotationSlug(sourcePdf)}-p${page}`;
  const outputPrefix = path.join(outDir, outputBase);
  const finalFile = path.join(outDir, `${outputBase}.png`);

  if (!existsSync(input)) {
    throw new Error(`Missing source PDF: ${input}`);
  }

  const result = spawnSync("pdftoppm", ["-png", "-r", "144", "-f", String(page), "-l", String(page), input, outputPrefix], {
    stdio: "inherit",
    env: {
      ...process.env,
      XDG_CACHE_HOME: path.join(process.cwd(), "tmp", "font-cache")
    }
  });

  if (result.status !== 0) {
    throw new Error(`pdftoppm failed for ${sourcePdf} page ${page}`);
  }

  const renderedFile = readdirSync(outDir).find((file) => file.startsWith(`${outputBase}-`) && file.endsWith(".png"));
  if (!renderedFile) {
    throw new Error(`Could not find rendered page for ${sourcePdf} page ${page}`);
  }

  if (path.join(outDir, renderedFile) !== finalFile) {
    renameSync(path.join(outDir, renderedFile), finalFile);
  }
}

console.log(`Rendered ${pages.size} annotation pages.`);

function annotationSlug(sourcePdf) {
  return sourcePdf
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
