"use client";

/* eslint-disable @next/next/no-img-element */
import { Fragment, useMemo, useState } from "react";
import { declaredLifecycleTotal, getStageValue } from "../lib/product-utils";
import { lifecycleStages, type CarbonFigure, type EpdProduct, type LifecycleStage } from "../lib/schema";

type SortKey = "product" | "supplier" | "strength" | "location" | "a1a3" | "declaredTotal";
type SelectedEvidence = {
  product: EpdProduct;
  figure: CarbonFigure;
};

const stageLabels: Record<LifecycleStage, string> = {
  "A1-A3": "A1-A3",
  A4: "A4",
  A5: "A5",
  B1: "B1",
  B2: "B2",
  B3: "B3",
  B4: "B4",
  B5: "B5",
  B6: "B6",
  B7: "B7",
  C1: "C1",
  C2: "C2",
  C3: "C3",
  C4: "C4",
  D: "D"
};

export function ProductComparison({ products }: { products: EpdProduct[] }) {
  const [location, setLocation] = useState("all");
  const [strength, setStrength] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("a1a3");
  const [expanded, setExpanded] = useState<string | null>(products[0]?.id ?? null);
  const [selectedEvidence, setSelectedEvidence] = useState<SelectedEvidence | null>(null);

  const locations = useMemo(
    () => ["all", ...Array.from(new Set(products.map((product) => product.manufacturingLocation.region))).sort()],
    [products]
  );

  const strengths = useMemo(
    () =>
      [
        "all",
        ...Array.from(
          new Set(
            products
              .map((product) => product.compressiveStrength?.value)
              .filter((value): value is number => typeof value === "number")
          )
        ).sort((a, b) => a - b)
      ],
    [products]
  );

  const filtered = useMemo(() => {
    return products
      .filter((product) => location === "all" || product.manufacturingLocation.region === location)
      .filter((product) => strength === "all" || product.compressiveStrength?.value === Number(strength))
      .sort((a, b) => compare(a, b, sortKey));
  }, [location, products, sortKey, strength]);

  const missingCount = filtered.reduce(
    (count, product) => count + product.carbon.filter((figure) => figure.status !== "declared").length,
    0
  );

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Low Carbon Materials Hub</p>
          <h1>Concrete EPD comparison</h1>
        </div>
        <div className="summary-grid" aria-label="Dataset summary">
          <Stat label="Products" value={String(products.length)} />
          <Stat label="Visible" value={String(filtered.length)} />
          <Stat label="Unavailable cells" value={String(missingCount)} />
        </div>
      </header>

      <section className="controls" aria-label="Comparison filters">
        <label>
          Location
          <select value={location} onChange={(event) => setLocation(event.target.value)}>
            {locations.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All locations" : option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Strength
          <select value={strength} onChange={(event) => setStrength(event.target.value)}>
            {strengths.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All MPa" : `${option} MPa`}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
            <option value="a1a3">Lowest A1-A3</option>
            <option value="declaredTotal">Lowest declared lifecycle sum</option>
            <option value="strength">Strength</option>
            <option value="location">Location</option>
            <option value="supplier">Supplier</option>
            <option value="product">Product</option>
          </select>
        </label>
      </section>

      <section className="notice">
        <strong>Comparison warning:</strong> a blank or ND stage is not zero. Totals shown here sum only declared
        stages excluding module D, so products with different scopes should be compared stage by stage.
      </section>

      <section className="table-wrap" aria-label="Concrete products">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Supplier</th>
              <th>MPa</th>
              <th>Location</th>
              <th>A1-A3</th>
              {lifecycleStages.slice(1).map((stage) => (
                <th key={stage}>{stageLabels[stage]}</th>
              ))}
              <th>Declared sum</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const a1a3 = getStageValue(product, "A1-A3");
              return (
                <Fragment key={product.id}>
                  <tr
                    className={expanded === product.id ? "is-expanded" : ""}
                    onClick={() => setExpanded(expanded === product.id ? null : product.id)}
                  >
                    <td>
                      <button className="row-button" type="button">
                        {product.productName}
                      </button>
                    </td>
                    <td>{product.supplier}</td>
                    <td>{product.compressiveStrength?.value ?? "Unclear"}</td>
                    <td>{product.manufacturingLocation.region}</td>
                    <td>{formatCarbon(a1a3)}</td>
                    {lifecycleStages.slice(1).map((stage) => (
                      <td key={`${product.id}-${stage}`}>{formatCarbon(getStageValue(product, stage))}</td>
                    ))}
                    <td>{declaredLifecycleTotal(product).toFixed(1)}</td>
                  </tr>
                  {expanded === product.id ? (
                    <tr className="detail-row">
                      <td colSpan={20}>
                        <ProductDetail product={product} onOpenEvidence={(figure) => setSelectedEvidence({ product, figure })} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </section>
      {selectedEvidence ? (
        <EvidenceModal
          product={selectedEvidence.product}
          figure={selectedEvidence.figure}
          onClose={() => setSelectedEvidence(null)}
        />
      ) : null}
    </div>
  );
}

function ProductDetail({
  product,
  onOpenEvidence
}: {
  product: EpdProduct;
  onOpenEvidence: (figure: CarbonFigure) => void;
}) {
  const declaredFigures = product.carbon.filter((figure) => figure.status === "declared");

  return (
    <div className="detail-panel">
      <div>
        <h2>{product.productName}</h2>
        <p>{product.lifecycleScope}</p>
        <p>
          Declared unit: {product.declaredUnit}
          {product.declaredUnitMassKg ? `, ${product.declaredUnitMassKg} kg` : ""}
        </p>
        <p>Source PDF: {product.sourcePdf}</p>
      </div>
      <div className="provenance-grid">
        {declaredFigures.map((figure) => (
          <button
            className="provenance-card"
            key={`${product.id}-${figure.stage}`}
            type="button"
            onClick={() => onOpenEvidence(figure)}
          >
            <div>
              <strong>{figure.stage}</strong>
              <span>{figure.value} kg CO2e</span>
            </div>
            <p>
              Page {figure.provenance?.page}, {figure.provenance?.tableOrSection}
            </p>
            <p>{figure.provenance?.excerpt}</p>
          </button>
        ))}
      </div>
      <ul className="notes">
        {product.comparabilityNotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  );
}

function EvidenceModal({
  product,
  figure,
  onClose
}: {
  product: EpdProduct;
  figure: CarbonFigure;
  onClose: () => void;
}) {
  const provenance = figure.provenance;
  if (!provenance) return null;

  const highlight = provenance.annotation;
  const imagePath = `/annotations/${annotationSlug(provenance.sourcePdf)}-p${provenance.page}.png`;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="evidence-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${product.productName} ${figure.stage} source evidence`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">Source evidence</p>
            <h2>
              {product.productName} - {figure.stage}
            </h2>
          </div>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close evidence modal">
            x
          </button>
        </header>
        <div className="modal-meta">
          <span>{figure.value} kg CO2e</span>
          <span>Page {provenance.page}</span>
          <span>{provenance.tableOrSection}</span>
        </div>
        <div className="pdf-frame">
          <div className="pdf-page">
            <img src={imagePath} alt={`Rendered source page ${provenance.page} from ${provenance.sourcePdf}`} />
            {highlight ? (
              <span
                aria-hidden="true"
                className="highlight-box cell"
                data-stage={figure.stage}
                style={{
                  left: `${highlight.left}%`,
                  top: `${highlight.top}%`,
                  width: `${highlight.width}%`,
                  height: `${highlight.height}%`
                }}
              />
            ) : null}
          </div>
        </div>
        <p className="modal-excerpt">{provenance.excerpt}</p>
        <p className="modal-source">{provenance.sourcePdf}</p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatCarbon(figure: ReturnType<typeof getStageValue>) {
  if (!figure || figure.status !== "declared" || figure.value === null) {
    return <span className="missing">ND</span>;
  }

  return <span className={figure.value < 0 ? "negative" : ""}>{figure.value.toFixed(figure.value < 10 ? 2 : 1)}</span>;
}

function compare(a: EpdProduct, b: EpdProduct, key: SortKey) {
  if (key === "product") return a.productName.localeCompare(b.productName);
  if (key === "supplier") return a.supplier.localeCompare(b.supplier);
  if (key === "location") return a.manufacturingLocation.region.localeCompare(b.manufacturingLocation.region);
  if (key === "strength") {
    return (a.compressiveStrength?.value ?? 999) - (b.compressiveStrength?.value ?? 999);
  }
  if (key === "declaredTotal") return declaredLifecycleTotal(a) - declaredLifecycleTotal(b);
  return (getStageValue(a, "A1-A3")?.value ?? 9999) - (getStageValue(b, "A1-A3")?.value ?? 9999);
}

function annotationSlug(sourcePdf: string) {
  return sourcePdf
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
