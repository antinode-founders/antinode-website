# antinode.bio

Single-page public website for antinode. Static HTML on GitHub Pages, built and
deployed by GitHub Actions. Dark theme, responsive (phone · tablet · desktop),
styled only through the antinode brand kit.

The page deliberately says only that antinode is a medical technology research
organisation. Investors, suppliers and research partners use the contact form;
investors can optionally be linked to the data room.

```
push / PR ──► build.py ──► html-validate ──► Playwright (phone, tablet, desktop) ──► upload artifact
                                                                                       │
                                                              push to main only ──► deploy-pages ──► antinode.bio
```

## Layout

| Path | What |
|---|---|
| `site/index.html` | The page. `{{PLACEHOLDERS}}` and `<!-- dataroom -->` blocks are filled by the build |
| `site/assets/site.css`, `site.js` | Page layout, standing-wave figure, contact-form handling |
| `site/assets/brand/` | **Generated** — copied from `antinode-style-assets`. Don't edit; run `scripts/sync-brand.sh` |
| `scripts/build.py` | `site/` → `_site/` with configuration and a strict Content-Security-Policy |
| `scripts/og-image.*` | Renders the social share image `site/assets/img/og-image.png` |
| `tests/site.spec.js` | No console errors, no horizontal scroll, all assets resolve, form success and failure paths |
| `.github/workflows/deploy.yml` | CI/CD |

## Configuration (repository variables)

Settings → Secrets and variables → Actions → **Variables**:

| Variable | Required | Example | Effect |
|---|---|---|---|
| `CONTACT_FORM_ENDPOINT` | yes | `https://formspree.io/f/abcd1234` | Where the form posts. Build fails if unset |
| `DATAROOM_URL` | no | `https://dataroom.example.com/antinode` | Adds "Investor data room" links. Omit to hide them |
| `SITE_URL` | no | `https://antinode.bio` (default) | Canonical URL, sitemap, social tags |

Change a variable, then re-run the workflow (Actions → deploy → Run workflow).

## One-time setup

1. **Contact form** — create a form at [formspree.io](https://formspree.io)
   (any service that accepts a form POST and returns JSON for
   `Accept: application/json` works). In the form's settings:
   - set the notification email to the inbox that should receive enquiries
   - restrict submissions to `antinode.bio`
   - turn off Formspree's reCAPTCHA (the page uses a honeypot field; reCAPTCHA blocks in-page submissions)

   Put the form URL in `CONTACT_FORM_ENDPOINT`.
2. **Pages** — Settings → Pages → Source: **GitHub Actions**.
3. **Branch** — merge this work into `main`; every push to `main` deploys.
4. **Domain** — Settings → Pages → Custom domain: `antinode.bio`, then tick
   **Enforce HTTPS** once the certificate is issued. Also verify the domain for
   the organisation (org Settings → Pages → Add a domain) to prevent takeover.
5. **DNS** at the registrar:

| Host | Type | Value |
|---|---|---|
| `@` | A | `185.199.108.153` · `185.199.109.153` · `185.199.110.153` · `185.199.111.153` |
| `@` | AAAA | `2606:50c0:8000::153` · `2606:50c0:8001::153` · `2606:50c0:8002::153` · `2606:50c0:8003::153` |
| `www` | CNAME | `antinode-founders.github.io` |

## Local development

```bash
npm ci
CONTACT_FORM_ENDPOINT=https://formspree.io/f/test npm run build
npm run validate && npx playwright test --trace off
npm run serve                      # http://localhost:8080
```

## Updating the brand

```bash
scripts/sync-brand.sh ../antinode-style-assets   # copies css, js, fonts, icons; records the version
npm run og-image                                 # if the logo changed
```

Colours in `site.css` come only from brand roles (`var(--accent)`, `var(--surface)` …),
so a brand release flows through without page edits. Check with
`antinode check _site/index.html` from the brand repo.

## Copy rules

Keep the page vague about the technology: no mechanism, modality, indication or
results. House style is in the brand repo's `docs/voice.md` — lowercase
"antinode", Australian English, sentence case.
