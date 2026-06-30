import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const extractedAt = new Date("2026-06-30T00:00:00.000Z").toISOString();
const unit = "kg CO2e per declared unit";
const stageOrder = ["A1-A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "C1", "C2", "C3", "C4", "D"];

const products = [
  product({
    id: "hanson-p252080",
    sourcePdf: "EPD-IES-0014769_P252080.pdf",
    epdNumber: "EPD-IES-0014769:001",
    supplier: "Hanson Construction Materials Pty Ltd",
    productName: "P252080",
    declaredUnitMassKg: 2480,
    strength: 25,
    location: ["Australia", "Queensland - Brisbane", "Brisbane"],
    scope: "A1-A3 + A4-A5 + B1-B7 + C1-C4 + D, cradle-to-grave",
    values: [127, 2.45, 9.95, -2.65, 0, 0, 0, 0, 0, 0, 8.99, 8.85, 5.24, 2.79, 6.14],
    page: 21,
    table: "Core environmental impact indicators",
    excerpt: "GWP-tot kg CO2 eq. 1.27E+02 2.45E+00 9.95E+00 -2.65E+00 ... 6.14E+00"
  }),
  product({
    id: "heidelberg-ge322lpf2",
    sourcePdf: "EPD-IES-0014785_Heidelberg_Woolworths-GE322LPF2.pdf",
    epdNumber: "EPD-IES-0014785:001",
    supplier: "Heidelberg Materials Australia Pty Ltd",
    productName: "GE322LPF2",
    declaredUnitMassKg: 2355.5,
    strength: 32,
    location: ["Australia", "Queensland - Brisbane", "Brisbane"],
    scope: "A1-A3 + A4-A5 + B1-B7 + C1-C4 + D, cradle-to-grave",
    values: [145, 3.41, 10.1, -3.17, 0, 0, 0, 0, 0, 0, 8.99, 9.03, 5.19, 2.85, -14.1],
    page: 18,
    table: "Core environmental impact indicators",
    excerpt: "GWP-tot kg CO2 eq. 1.45E+02 3.41E+00 1.01E+01 -3.17E+00 ... -1.41E+01"
  }),
  product({
    id: "hymix-hylo-50-normal-class-25",
    sourcePdf: "EPD-IES-0014958_Hymix_GE252WA06-3_2024-11-19.pdf",
    epdNumber: "EPD-IES-0014958:001",
    supplier: "Hymix Australia Pty Ltd",
    productName: "HyLo-50 Normal-Class 25 MPa",
    declaredUnitMassKg: 2315,
    strength: 25,
    location: ["Australia", "Gold Coast", "Gold Coast"],
    scope: "A1-A3 + A4-A5 + B1-B7 + C1-C4 + D, cradle-to-grave",
    values: [141, 4.95, 10.7, -3.28, 0, 0, 0, 0, 0, 0, 9.64, 10.1, 4.44, 3.19, -13.1],
    page: 19,
    table: "Core environmental impact indicators",
    excerpt: "GWP-tot kg CO2 eq. 1.41E+02 4.95E+00 1.07E+01 -3.28E+00 ... -1.31E+01"
  }),
  product({
    id: "boral-envirocrete-40-32mpa",
    sourcePdf: "EPD_HUB-5210_2026-06-27_en.pdf",
    supplier: "Boral Limited",
    productName: "Envirocrete 40% 32MPa",
    declaredUnitMassKg: 2225,
    strength: 32,
    location: ["Australia", "Melbourne South-East", "Melbourne South-East"],
    scope: "Cradle-to-gate (A1-A3) with modules C1-C4 and D",
    values: [275, null, null, null, null, null, null, null, null, null, 4.23, 12, 6.82, 4.17, -12.2],
    page: 13,
    table: "Environmental impacts - EN 15804+A2",
    excerpt: "GWP - total kg CO2e: A1-A3 2.75E+02; C1 4.23E+00 C2 1.20E+01 C3 6.82E+00 C4 4.17E+00 D -1.22E+01",
    evidenceByStage: cAndDPage(14, "GWP - total kg CO2e: C1 4.23E+00 C2 1.20E+01 C3 6.82E+00 C4 4.17E+00 D -1.22E+01")
  }),
  hub("tandy-an3220100enhanced", "EPD_HUB-5394_2026-06-27_en.pdf", "Tandy Concrete", "AN3220100Enhanced", 2352, 32, "Central Queensland", [232, 2.79, 15.1, null, null, null, null, null, null, null, 4.48, 12.7, 7.2, 4.41, -13.2]),
  hub("tandy-atilts4020100enhanced", "EPD_HUB-5480_2026-06-27_en.pdf", "Tandy Concrete", "ATILTS4020100Enhanced", 2408, 40, "Central Queensland", [280, 2.85, 16.6, null, null, null, null, null, null, null, 4.58, 13, 7.38, 4.51, -13.5]),
  hub("tandy-ctilts4020100enhanced", "EPD_HUB-5527_2026-06-27_en.pdf", "Tandy Concrete", "CTILTS4020100Enhanced", 2388, 40, "Central Queensland", [284, 2.19, 16.7, null, null, null, null, null, null, null, 4.54, 12.9, 7.31, 4.47, -13.4]),
  product({
    id: "boral-40mpa-20mm-enviro-50-scm",
    sourcePdf: "EPD_HUB-5555_2026-06-27_en.pdf",
    supplier: "Boral Limited",
    productName: "40MPa 20mm Enviro 50% SCM 100SL Conc",
    declaredUnitMassKg: 2338,
    strength: 40,
    location: ["Australia", "Melbourne", "Melbourne"],
    scope: "Cradle-to-gate (A1-A3) with modules C1-C4 and D",
    values: [220, null, null, null, null, null, null, null, null, null, 4.45, 12.6, 7.16, 4.38, -12.8],
    page: 13,
    table: "Environmental impacts - EN 15804+A2",
    excerpt: "GWP - total kg CO2e: A1-A3 2.20E+02; C1 4.45E+00 C2 1.26E+01 C3 7.16E+00 C4 4.38E+00 D -1.28E+01",
    evidenceByStage: cAndDPage(14, "GWP - total kg CO2e: C1 4.45E+00 C2 1.26E+01 C3 7.16E+00 C4 4.38E+00 D -1.28E+01")
  }),
  product({
    id: "boral-50mpa-20mm-enviro-50-scm",
    sourcePdf: "EPD_HUB-5556_2026-06-27_en.pdf",
    supplier: "Boral Limited",
    productName: "50MPa 20mm Enviro 50% SCM 100SL Conc",
    declaredUnitMassKg: 2377,
    strength: 50,
    location: ["Australia", "Melbourne", "Melbourne"],
    scope: "Cradle-to-gate (A1-A3) with modules C1-C4 and D",
    values: [268, null, null, null, null, null, null, null, null, null, 4.52, 12.8, 7.28, 4.45, -13],
    page: 13,
    table: "Environmental impacts - EN 15804+A2",
    excerpt: "GWP - total kg CO2e: A1-A3 2.68E+02; C1 4.52E+00 C2 1.28E+01 C3 7.28E+00 C4 4.45E+00 D -1.30E+01",
    evidenceByStage: cAndDPage(14, "GWP - total kg CO2e: C1 4.52E+00 C2 1.28E+01 C3 7.28E+00 C4 4.45E+00 D -1.30E+01")
  }),
  hub("entire-n25-10-100-xencrete", "EPD_HUB-5749_2026-06-27_en.pdf", "Entire Concrete", "N25/10/100 Xencrete", 2286, 25, "Hunter Valley, NSW", [209, 2.93, 14.4, null, null, null, null, null, null, null, 4.35, 12.3, 7, 4.28, -11.8], ["The summary table rounds A1-A3 to 208 kg CO2e; the detailed lifecycle row reports 2.09E+02."]),
  product({
    id: "boral-40mpa-high-performance",
    sourcePdf: "EPD_HUB-5882_2026-06-27_en.pdf",
    supplier: "Boral Limited",
    productName: "40 MPa High Performance Concrete",
    declaredUnitMassKg: 2338,
    strength: 40,
    location: ["Australia", "Melbourne", "Melbourne"],
    scope: "Cradle-to-gate (A1-A3) with modules C1-C4 and D",
    values: [297, null, null, null, null, null, null, null, null, null, 4.45, 12.6, 7.16, 4.38, -12.8],
    page: 13,
    table: "Environmental impacts - EN 15804+A2",
    excerpt: "GWP - total kg CO2e: A1-A3 2.97E+02; C1 4.45E+00 C2 1.26E+01 C3 7.16E+00 C4 4.38E+00 D -1.28E+01",
    evidenceByStage: cAndDPage(14, "GWP - total kg CO2e: C1 4.45E+00 C2 1.26E+01 C3 7.16E+00 C4 4.38E+00 D -1.28E+01")
  }),
  hub("entire-n50-20-xencrete", "EPD_HUB-5943_2026-06-27_en.pdf", "Entire Concrete", "N50/20 Xencrete", 2272, 50, "Hunter Valley, NSW", [310, 2.91, 17.5, null, null, null, null, null, null, null, 4.32, 12.2, 6.96, 4.26, -11.7]),
  hub("entire-n40-20-xencrete", "EPD_HUB-5991_2026-06-27_en.pdf", "Entire Concrete", "N40/20 Xencrete", 2306, 40, "Hunter Valley, NSW", [273, 2.96, 16.4, null, null, null, null, null, null, null, 4.39, 12.4, 7.06, 4.32, -11.9]),
  product({
    id: "hallett-n2520p-t50-dry-creek",
    sourcePdf: "epd-australasia-com-wp-content-uploads-2023-08-epd-ies-0009353-003-hallett-ready-mix-concrete-2026-05-04-pdf.pdf",
    supplier: "Hallett Concrete",
    productName: "N2520P T50 - Dry Creek sample from multi-product EPD",
    declaredUnitMassKg: 2311,
    strength: 25,
    location: ["Australia", "South Australia", "Dry Creek"],
    scope: "Cradle-to-gate A1-A3 by plant/mix, with representative C1-C4 and D scenario",
    values: [171, null, null, null, null, null, null, null, null, null, 14.8, 5.96, 5.02, 8.45, -11.6],
    page: 11,
    table: "Table 13",
    excerpt: "Table 13 GWPt N2520P T50 171; Table 43 representative GWPt C1 14.8 C2 5.96 C3 5.02 C4 8.45 D -11.6",
    evidenceByStage: {
      C1: { page: 35, table: "Table 43", excerpt: "Table 43 representative GWPt C1 14.8 C2 5.96 C3 5.02 C4 8.45 D -11.6" },
      C2: { page: 35, table: "Table 43", excerpt: "Table 43 representative GWPt C1 14.8 C2 5.96 C3 5.02 C4 8.45 D -11.6" },
      C3: { page: 35, table: "Table 43", excerpt: "Table 43 representative GWPt C1 14.8 C2 5.96 C3 5.02 C4 8.45 D -11.6" },
      C4: { page: 35, table: "Table 43", excerpt: "Table 43 representative GWPt C1 14.8 C2 5.96 C3 5.02 C4 8.45 D -11.6" },
      D: { page: 35, table: "Table 43", excerpt: "Table 43 representative GWPt C1 14.8 C2 5.96 C3 5.02 C4 8.45 D -11.6" }
    },
    notes: ["This PDF covers many mixes and plants. A1-A3 is the N2520P T50 Dry Creek row; C/D is the EPD representative average-density scenario."]
  }),
  product({
    id: "holcim-qx25mor-geostone",
    sourcePdf: "epd-australasia-com-wp-content-uploads-2024-12-epd-ies-0014327-002-holcim-qld-seq-geostone-qx25mor-2026-04-02-pdf.pdf",
    supplier: "Holcim Australia Pty Ltd",
    productName: "QX25MOR - S25 MORETON GEOSTONE",
    declaredUnitMassKg: 2361,
    strength: 25,
    location: ["Australia", "Queensland - SEQ", "Multiple SEQ production sites"],
    scope: "Cradle-to-gate (A1-A3) with A4-A5, C1-C4 and D",
    values: [237, 2.63, 15.6, null, null, null, null, null, null, null, 0.522, 4.39, 10.5, 0, -18.8],
    page: 16,
    table: "Primary environmental indicators",
    excerpt: "GWP-Total kg CO2 eq. 237 2.63 15.6 0.522 4.39 10.5 0 -18.8"
  }),
  product({
    id: "holcim-qe252m100-ecopact",
    sourcePdf: "epd-australasia-com-wp-content-uploads-2025-05-epd-ies-0029695-001-holcim-qld-brisbane-ecopact-qe252m100-2026-04-15-1-pdf.pdf",
    supplier: "Holcim Australia Pty Ltd",
    productName: "QE252M100 - S25/20/100 ECOPact Concrete",
    declaredUnitMassKg: 2319,
    strength: 25,
    location: ["Australia", "Queensland - Brisbane", "Multiple Brisbane production sites"],
    scope: "Cradle-to-gate (A1-A3) with A4-A5, C1-C4 and D",
    values: [146, 2.58, 12.9, null, null, null, null, null, null, null, 0.522, 4.31, 10.4, 0, -18.5],
    page: 16,
    table: "Primary environmental indicators",
    excerpt: "GWP-Total kg CO2 eq. 146 2.58 12.9 0.522 4.31 10.4 0 -18.5"
  }),
  product({
    id: "adbri-sn252f100",
    sourcePdf: "epd-ies-0021165-sn252f100.pdf",
    supplier: "Adbri Limited",
    productName: "SN252F100 - Futurecrete Normal Class GL-Slag 25 MPa",
    declaredUnitMassKg: null,
    strength: 25,
    location: ["Australia", "South Australia", "South Australia"],
    scope: "Product stage A1-A3 plus distribution A4",
    values: [143.83, 9.64, null, null, null, null, null, null, null, null, null, null, null, null, null],
    page: 32,
    table: "Table 8 and Table 13",
    excerpt: "Table 8 SN252F100 GWPT 143.83; Table 13 Concrete produced at South Australia GWP-total 9.64",
    method: "visual_review",
    evidenceByStage: {
      A4: {
        page: 34,
        table: "Table 13",
        excerpt: "Table 13 Concrete produced at South Australia GWP-total 9.64"
      }
    },
    notes: ["A1-A3 row was verified from a rendered page because the PDF text layer omits the table body."]
  }),
  product({
    id: "aurora-ar2520-rockbank",
    sourcePdf: "epd-ies-0021754-001-acm-rockbank-ar2520.pdf",
    supplier: "Aurora Construction Materials",
    productName: "AR2520 pre-mixed concrete",
    declaredUnitMassKg: 2270,
    strength: 25,
    location: ["Australia", "Victoria", "Rockbank"],
    scope: "A1-A3, C1-C4 and D",
    values: [140, null, null, null, null, null, null, null, null, null, 12, 14.5, 8.03, 0.861, -9.79],
    page: 18,
    table: "Table of core environmental impact indicators",
    excerpt: "GWP-total kg CO2-eq. 1.40E+02 1.20E+01 1.45E+01 8.03E+00 8.61E-01 -9.79E+00"
  }),
  product({
    id: "premix-s32mpa-greencrete-70",
    sourcePdf: "epd-ies-0023043-s32mpa-greencrete-70.pdf",
    supplier: "Concrite / GreenCrete",
    productName: "Premix Concrete - S32MPa GreenCrete 70",
    declaredUnitMassKg: null,
    strength: 32,
    location: ["Australia", "Victoria", "Port Melbourne"],
    scope: "A1-A3, C1-C4 and D",
    values: [134, null, null, null, null, null, null, null, null, null, 5.67, 21.6, 12.5, 2.29, -1.61],
    page: 11,
    table: "Primary environmental indicators",
    excerpt: "GWP - total kg CO2 eq 1.34E+02 5.67E+00 2.16E+01 1.25E+01 2.29E+00 -1.61E+00"
  }),
  product({
    id: "holcim-ve322eamf-ecopactmax",
    sourcePdf: "epd-ies-20602-001-holcim-vic-melbourne-metro-ecopact-ve322eamf-epd.pdf",
    supplier: "Holcim Australia Pty Ltd",
    productName: "VE322EAMF - S32@56D 20mm 120SL ECOPactMAX FIB CONC",
    declaredUnitMassKg: 2400,
    strength: 32,
    location: ["Australia", "Victoria - Melbourne Metro", "Multiple Melbourne Metro production sites"],
    scope: "Cradle-to-gate (A1-A3) with A4-A5, C1-C4 and D",
    values: [105, 2.05, 8.81, null, null, null, null, null, null, null, 0.532, 3.99, 7.61, 1.28, -15.7],
    page: 15,
    table: "Primary environmental indicators",
    excerpt: "GWP-Total kg CO2 eq. 105 2.05 8.81 0.532 3.99 7.61 1.28 -15.7"
  })
];

mkdirSync("data", { recursive: true });

for (const item of products) {
  writeFileSync(path.join("data", `${item.id}.json`), `${JSON.stringify(item, null, 2)}\n`);
}

console.log(`Wrote ${products.length} product JSON files.`);

function hub(id, sourcePdf, supplier, productName, mass, strength, region, values, notes = []) {
  const page = sourcePdf === "EPD_HUB-5749_2026-06-27_en.pdf" || sourcePdf === "EPD_HUB-5943_2026-06-27_en.pdf" || sourcePdf === "EPD_HUB-5991_2026-06-27_en.pdf" ? 8 : 9;
  return product({
    id,
    sourcePdf,
    supplier,
    productName,
    declaredUnitMassKg: mass,
    strength,
    location: ["Australia", region, region],
    scope: "Cradle-to-gate (A1-A3) with A4-A5, C1-C4 and D",
    values,
    page,
    table: "Environmental impacts - EN 15804+A2",
    excerpt: "GWP - total lifecycle table row",
    notes
  });
}

function cAndDPage(page, excerpt) {
  return Object.fromEntries(["C1", "C2", "C3", "C4", "D"].map((stage) => [stage, { page, table: "Environmental impacts - EN 15804+A2", excerpt }]));
}

function product(config) {
  const declaredUnit = "1 m3 of ready-mix concrete";
  const sourcePath = path.join(process.cwd(), "tmp", "extracted", config.sourcePdf.replace(/\.pdf$/, ".txt"));
  let fullText = "";
  try {
    fullText = readFileSync(sourcePath, "utf8");
  } catch {
    // The curated rows still carry page references; text extracts are a convenience.
  }

  return {
    id: config.id,
    sourcePdf: config.sourcePdf,
    epdNumber: config.epdNumber,
    supplier: config.supplier,
    productName: config.productName,
    productType: "Ready-mix concrete",
    declaredUnit,
    declaredUnitMassKg: config.declaredUnitMassKg,
    compressiveStrength: {
      value: config.strength,
      unit: "MPa",
      status: "declared"
    },
    manufacturingLocation: {
      country: config.location[0],
      region: config.location[1],
      site: config.location[2]
    },
    lifecycleScope: config.scope,
    comparabilityNotes: [
      "Compare only products with the same declared unit and equivalent application context.",
      "Not-declared stages are shown as unavailable, not as zero.",
      ...(config.notes ?? [])
    ],
    carbon: stageOrder.map((stage, index) => {
      const value = config.values[index];
      if (value === null || value === undefined) {
        return {
          stage,
          status: stage.startsWith("B") ? "not_declared" : "not_declared",
          value: null,
          unit,
          provenance: null
        };
      }
      return {
        stage,
        status: "declared",
        value,
        unit,
        provenance: {
          sourcePdf: config.sourcePdf,
          page: config.evidenceByStage?.[stage]?.page ?? findPage(fullText, config.excerpt) ?? config.page,
          tableOrSection: config.evidenceByStage?.[stage]?.table ?? config.table,
          excerpt: config.evidenceByStage?.[stage]?.excerpt ?? config.excerpt,
          extractionMethod: config.method ?? "manual_cross_check",
          confidence: config.method === "visual_review" ? "medium" : "high",
          notes: config.notes?.join(" ")
        }
      };
    }),
    extractedAt
  };
}

function findPage(fullText, excerpt) {
  if (!fullText) return null;
  const pages = fullText.split("\f");
  const token = excerpt.split(" ").slice(0, 3).join(" ");
  const index = pages.findIndex((page) => page.includes(token));
  return index === -1 ? null : index + 1;
}
