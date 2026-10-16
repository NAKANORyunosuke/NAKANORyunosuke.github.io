# nakanoryunosuke.github.io

Modernized GitHub Pages setup for the Jekyll + TypeScript site.

## Stack
- Jekyll with `github-pages` gem and minima-based layouts
- TypeScript utilities compiled to plain JS
- GitHub Pages deployment via official `actions/deploy-pages`
- Bundled frontend entrypoint via `esbuild` (`src/ts/main.ts` → `assets/js/main.js`)

## Local development
1. `npm ci`
2. `bundle install`
3. `npm run build`
4. `bundle exec jekyll serve`

## Deployment flow
- Push to `main` (or run the workflow manually) to trigger `.github/workflows/deploy.yml`.
- The workflow builds assets (`npm run build`), then the Jekyll site (`bundle exec jekyll build --trace`).
- The built `_site` directory is uploaded as a Pages artifact and published by `actions/deploy-pages@v4`. There is no need to manage the `gh-pages` branch manually.

## Preprints
- Put the PDF in `assets/pdf/preprints/` and add `pdf: "/assets/pdf/preprints/<file>.pdf"` to the entry in the `preprints` section of `_data/research.yml`. The PDF link then appears on `research-activity.html` and `preprints.html`.
- Once the paper is on arXiv, add the arXiv link to the entry's `description` and keep the `pdf:` line; both links are shown. Replace the PDF when a new version is posted.
