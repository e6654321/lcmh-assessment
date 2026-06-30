# Extraction Notes

I started by copying the 20 supplied EPDs into `source-epds/` and creating layout-preserving text extracts with `pdftotext`. I kept the schema narrow: product identity, declared unit, strength, manufacturing location, lifecycle scope, and GWP-total by module. For every declared carbon number I recorded the PDF filename, page, table or section, excerpt, extraction method, and confidence.

The PDFs split into two main patterns. EPD Hub documents usually had both an environmental summary and a lifecycle table; when those differed by rounding, I used the detailed lifecycle row. The EPD Australasia/IES documents usually had product-specific “GWP-tot” rows, so I extracted the module columns directly from those tables.

I did not force every document into a single-product shape when the source did not support it. The Hallett PDF covers many mixes and plants, so I selected one clearly named representative row and added a comparability note that its C/D values come from the representative average-density scenario. The Adbri text layer has no table body, so I visually checked the SN252F100 A1-A3 value before recording it.

The main accuracy risk is false comparability. Some EPDs include A4/A5, some omit them, some declare end-of-life modules, and module D is a credit outside the product system. The app therefore defaults to A1-A3 sorting, shows lifecycle stages separately, marks missing stages as `ND`, and treats not-declared values as unavailable rather than zero. The “declared sum” is only a scanning aid; it is not a normalized full-life result.

I added validation after extraction because provenance is easy to lose during cleanup. A numeric carbon value without source metadata fails the check, and missing lifecycle stages must be explicit statuses.
