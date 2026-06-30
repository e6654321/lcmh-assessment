import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const pdfDir = path.join(process.cwd(), "source-epds");

const failures = [];
const manual = [];
const allowedManual = new Set(["adbri-sn252f100.json A1-A3"]);
let checked = 0;

for (const file of readdirSync(dataDir).filter((name) => name.endsWith(".json")).sort()) {
  const product = JSON.parse(readFileSync(path.join(dataDir, file), "utf8"));

  for (const figure of product.carbon) {
    if (figure.status !== "declared") continue;
    const provenance = figure.provenance;
    const annotation = provenance?.annotation;

    if (!provenance || !annotation) {
      failures.push(`${file} ${figure.stage}: missing annotation.`);
      continue;
    }

    const result = spawnSync(
      "pdftotext",
      ["-f", String(provenance.page), "-l", String(provenance.page), "-tsv", path.join(pdfDir, provenance.sourcePdf), "-"],
      { encoding: "utf8" }
    );

    if (result.status !== 0) {
      failures.push(`${file} ${figure.stage}: pdftotext failed.`);
      continue;
    }

    const words = parseTsv(result.stdout);
    const pageBox = words.find((word) => word.text === "###PAGE###");
    if (!pageBox) {
      failures.push(`${file} ${figure.stage}: no PDF page box found.`);
      continue;
    }

    const valueWords = findValueWords(words, figure.value);
    if (!valueWords.length) {
      const key = `${file} ${figure.stage}`;
      if (allowedManual.has(key)) {
        manual.push(`${key}: no target value in text layer; visually reviewed manual annotation.`);
      } else {
        failures.push(`${key}: no target value in text layer and no manual review allowance.`);
      }
      continue;
    }

    const box = {
      left: (annotation.left / 100) * pageBox.width,
      top: (annotation.top / 100) * pageBox.height,
      right: ((annotation.left + annotation.width) / 100) * pageBox.width,
      bottom: ((annotation.top + annotation.height) / 100) * pageBox.height
    };

    const matches = valueWords.filter((word) => overlaps(box, word));
    if (!matches.length) {
      failures.push(`${file} ${figure.stage}: highlight does not overlap value ${figure.value} on page ${provenance.page}.`);
      continue;
    }

    checked += 1;
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Audited ${checked} text-layer annotation boxes.`);
if (manual.length) {
  console.log(`${manual.length} annotation requires visual review:`);
  for (const item of manual) console.log(`- ${item}`);
}

function parseTsv(tsv) {
  return tsv
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const parts = line.split("\t");
      return {
        left: Number(parts[6]),
        top: Number(parts[7]),
        width: Number(parts[8]),
        height: Number(parts[9]),
        text: parts.slice(11).join("\t")
      };
    })
    .filter((word) => Number.isFinite(word.left) && word.text);
}

function findValueWords(words, value) {
  const wanted = numericCandidates(value);
  const numeric = Number(value);
  return words.filter((word) => {
    if (wanted.has(normalizeNumber(word.text))) return true;
    const parsed = parsePdfNumber(word.text);
    if (parsed === null) return false;
    return Math.abs(parsed - numeric) <= Math.max(0.005, Math.abs(numeric) * 0.0005);
  });
}

function numericCandidates(value) {
  const candidates = new Set();
  const numeric = Number(value);
  candidates.add(normalizeNumber(String(value)));
  candidates.add(normalizeNumber(numeric.toFixed(0)));
  candidates.add(normalizeNumber(numeric.toFixed(1)));
  candidates.add(normalizeNumber(numeric.toFixed(2)));
  candidates.add(normalizeNumber(numeric.toExponential(2).replace("e+", "E+").replace("e-", "E-")));
  candidates.add(normalizeNumber(numeric.toExponential(1).replace("e+", "E+").replace("e-", "E-")));
  return candidates;
}

function normalizeNumber(text) {
  const cleaned = text
    .replace(/[−‐‑‒–—]/g, "-")
    .replace(/\s/g, "")
    .toLowerCase();

  if (cleaned.includes(",") && !cleaned.includes(".")) {
    return cleaned.replace(",", ".");
  }

  return cleaned.replace(/,/g, "");
}

function parsePdfNumber(text) {
  const normalized = normalizeNumber(text);
  if (!/^-?\d*\.?\d+(e[+-]?\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function overlaps(box, word) {
  const wordBox = {
    left: word.left,
    top: word.top,
    right: word.left + word.width,
    bottom: word.top + word.height
  };

  return box.left <= wordBox.right && box.right >= wordBox.left && box.top <= wordBox.bottom && box.bottom >= wordBox.top;
}
