# Squeeze

Drop images in, get JPEGs out — original pixel dimensions, smallest sensible file.
Compression runs on Tinify; the API key lives as a Worker secret and never reaches the browser.

## Layout

    public/index.html   the whole UI (no build step)
    src/index.js        Worker: POST /api -> Tinify shrink + convert
    wrangler.jsonc      config; `assets.directory` serves public/
    package.json        wrangler as the only dev dependency

Requests that match a file in `public/` are served straight from the edge without
invoking the Worker. Everything else hits `src/index.js`, which only answers `POST /api`.

## Deploy

Connected to GitHub via Workers Builds: push to `main` and it deploys.

Set the secret once, in the dashboard:
Worker -> Settings -> Variables and Secrets -> Add -> type **Secret** -> `TINIFY_KEY`.

## Local development

    npm install
    echo 'TINIFY_KEY=your-key' > .dev.vars   # gitignored
    npm run dev

## Credits

A JPEG source costs 1 Tinify credit. PNG/WebP/AVIF cost 2, because the JPEG
conversion counts as a second compression. Free tier is 500 per month.
