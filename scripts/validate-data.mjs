import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const stages = ["A1-A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "C1", "C2", "C3", "C4", "D"];
const statuses = new Set(["declared", "not_declared", "not_applicable", "unclear"]);
const dataDir = path.join(process.cwd(), "data");
const files = readdirSync(dataDir).filter((file) => file.endsWith(".json")).sort();

if (files.length !== 20) {
  throw new Error(`Expected 20 data files, found ${files.length}.`);
}

for (const file of files) {
  const product = JSON.parse(readFileSync(path.join(dataDir, file), "utf8"));

  requireString(product.id, file, "id");
  requireString(product.sourcePdf, file, "sourcePdf");
  requireString(product.supplier, file, "supplier");
  requireString(product.productName, file, "productName");
  requireString(product.declaredUnit, file, "declaredUnit");

  if (!Array.isArray(product.carbon) || product.carbon.length !== stages.length) {
    throw new Error(`${file}: expected ${stages.length} lifecycle stage records.`);
  }

  for (const stage of stages) {
    const figure = product.carbon.find((item) => item.stage === stage);
    if (!figure) throw new Error(`${file}: missing stage ${stage}.`);
    if (!statuses.has(figure.status)) throw new Error(`${file}: invalid status for ${stage}.`);

    if (figure.status === "declared") {
      if (typeof figure.value !== "number") {
        throw new Error(`${file}: ${stage} is declared without a numeric value.`);
      }
      if (!figure.provenance) {
        throw new Error(`${file}: ${stage} is declared without provenance.`);
      }
      requireString(figure.provenance.sourcePdf, file, `${stage}.provenance.sourcePdf`);
      requireString(figure.provenance.tableOrSection, file, `${stage}.provenance.tableOrSection`);
      requireString(figure.provenance.excerpt, file, `${stage}.provenance.excerpt`);
      if (!Number.isInteger(figure.provenance.page) || figure.provenance.page < 1) {
        throw new Error(`${file}: ${stage} provenance page must be a positive integer.`);
      }
      const annotationPath = path.join(
        process.cwd(),
        "public",
        "annotations",
        `${annotationSlug(figure.provenance.sourcePdf)}-p${figure.provenance.page}.png`
      );
      if (!existsSync(annotationPath)) {
        throw new Error(`${file}: ${stage} annotation image is missing at ${annotationPath}.`);
      }
      if (figure.provenance.annotation) {
        for (const key of ["left", "top", "width", "height"]) {
          if (typeof figure.provenance.annotation[key] !== "number") {
            throw new Error(`${file}: ${stage} annotation.${key} must be numeric.`);
          }
        }
      }
    }

    if (figure.status !== "declared" && figure.value === 0) {
      throw new Error(`${file}: ${stage} uses zero for missing data.`);
    }
  }
}

console.log(`Validated ${files.length} EPD data files.`);

function requireString(value, file, field) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${file}: ${field} must be a non-empty string.`);
  }
}

function annotationSlug(sourcePdf) {
  return sourcePdf
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
