# Low Carbon Materials Hub Assessment

Evidence-first concrete EPD comparison app built with Next.js, Node.js, and TypeScript.

## Run Locally

```bash
npm install
npm run extract
npm run validate:data
npm run dev
```

## Checks

```bash
npm run validate:data
npm run audit:annotations
npm run lint
npm run build
```

The app reads one JSON file per EPD from `data/`. Original PDFs are kept in `source-epds/` for traceability.

## Deployment Pipeline

GitHub Actions runs on pull requests, pushes to `main`, and manual dispatches. It installs Poppler, regenerates extracted EPD data and PDF annotation images, validates provenance, lints, builds, and deploys to Vercel from `main`.

Add these repository secrets before expecting automatic Vercel deploys:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

The workflow skips deployment when those secrets are missing, but still runs validation and build checks.

The PDFs in `source-epds/` should stay in GitHub unless IT moves them to a controlled artifact store and updates CI to fetch them before extraction. They are the source of truth for the carbon values, page references, and modal highlights.
