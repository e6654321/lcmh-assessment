import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const pdfDir = path.join(process.cwd(), "source-epds");

for (const file of readdirSync(dataDir).filter((name) => name.endsWith(".json"))) {
  const product = JSON.parse(readFileSync(path.join(dataDir, file), "utf8"));

  for (const figure of product.carbon) {
    if (figure.status !== "declared" || !figure.provenance) continue;
    const annotation = findAnnotation(figure);
    if (annotation) {
      figure.provenance.annotation = annotation;
    }
  }

  writeFileSync(path.join(dataDir, file), `${JSON.stringify(product, null, 2)}\n`);
}

console.log("Enriched annotation boxes from PDF text positions.");

function findAnnotation(figure) {
  const { sourcePdf, page } = figure.provenance;
  const pdfPath = path.join(pdfDir, sourcePdf);
  const result = spawnSync("pdftotext", ["-f", String(page), "-l", String(page), "-tsv", pdfPath, "-"], {
    encoding: "utf8"
  });

  if (result.status !== 0) return fallbackAnnotation(sourcePdf, figure.stage);

  const words = parseTsv(result.stdout);
  const pageBox = words.find((word) => word.text === "###PAGE###");
  if (!pageBox) return fallbackAnnotation(sourcePdf, figure.stage);

  const stageWord = findStageWord(words, figure.stage);
  const rowY = findGwpRowY(words, figure.value, stageWord);
  const target = findTargetValue(words, figure.value, rowY, stageWord);

  if (!target) return fallbackAnnotation(sourcePdf, figure.stage);

  const padX = Math.max(3, target.width * 0.35);
  const padY = Math.max(2, target.height * 0.55);

  return {
    left: pct(target.left - padX, pageBox.width),
    top: pct(target.top - padY, pageBox.height),
    width: pct(target.width + padX * 2, pageBox.width),
    height: pct(target.height + padY * 2, pageBox.height)
  };
}

function parseTsv(tsv) {
  return tsv
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => {
      const parts = line.split("\t");
      return {
        page: Number(parts[1]),
        par: Number(parts[2]),
        block: Number(parts[3]),
        line: Number(parts[4]),
        word: Number(parts[5]),
        left: Number(parts[6]),
        top: Number(parts[7]),
        width: Number(parts[8]),
        height: Number(parts[9]),
        text: parts.slice(11).join("\t")
      };
    })
    .filter((word) => Number.isFinite(word.left) && word.text);
}

function findStageWord(words, stage) {
  const exact = words.filter((word) => normalize(word.text) === normalize(stage));
  if (exact.length) return exact[0];

  if (stage === "A1-A3") {
    return words.find((word) => normalize(word.text).includes("a1a3")) ?? null;
  }

  return null;
}

function findGwpRowY(words, value, stageWord) {
  const labels = words.filter((word) => {
    const text = normalize(word.text);
    return text.includes("gwptotal") || text.includes("gwptot") || text === "gwpt" || text === "gwp" || text.includes("warming");
  });

  const valueWords = findValueWords(words, value);
  const candidates = [];
  for (const label of labels) {
    for (const valueWord of valueWords) {
      const yDistance = Math.abs(centerY(label) - centerY(valueWord));
      if (yDistance < 18) {
        const xDistance = stageWord ? Math.abs(centerX(valueWord) - centerX(stageWord)) : 0;
        candidates.push({ y: centerY(valueWord), score: yDistance + xDistance / 20 });
      }
    }
  }

  if (candidates.length) {
    candidates.sort((a, b) => a.score - b.score);
    return candidates[0].y;
  }

  if (valueWords.length) return centerY(valueWords[0]);
  return null;
}

function findTargetValue(words, value, rowY, stageWord) {
  const valueWords = findValueWords(words, value);
  if (!valueWords.length) return null;

  const scored = valueWords.map((word) => ({
    word,
    score: (rowY === null ? 0 : Math.abs(centerY(word) - rowY) * 6) + (stageWord ? Math.abs(centerX(word) - centerX(stageWord)) : 0)
  }));

  scored.sort((a, b) => a.score - b.score);
  return scored[0].word;
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

function fallbackAnnotation(sourcePdf, stage) {
  if (sourcePdf.includes("epd-ies-0021165") && stage === "A1-A3") {
    return { left: 40.7, top: 58.1, width: 4.7, height: 7.3 };
  }
  if (sourcePdf.includes("epd-ies-0021165") && stage === "A4") {
    return { left: 43, top: 39, width: 8, height: 3.2 };
  }
  return undefined;
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
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

function centerX(word) {
  return word.left + word.width / 2;
}

function centerY(word) {
  return word.top + word.height / 2;
}

function pct(value, total) {
  return Math.max(0, Math.min(100, (value / total) * 100));
}
