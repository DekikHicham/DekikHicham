# Landing Page Conversion Analyzer

A lightweight website that lets you analyze a landing page from either:

- A **URL** (auto-fetches readable page text when possible), or
- An **image/screenshot** (plus optional notes)

It produces:

- Conversion score (`0-100`)
- Framework analysis (value prop, audience clarity, offer)
- Funnel evaluation (CTA, trust, objections)
- Why it may convert
- What to add
- What to remove
- Top-priority CRO actions

## Run locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes

- URL fetching uses a read-only text proxy and may fail for some pages.
- For best output, paste key page copy (headline, CTA text, offer, proof elements).
