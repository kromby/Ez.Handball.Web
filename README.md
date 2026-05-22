# Ez.Handball.Web

Static single-page UI for one player's profile and tournament stats. No build step. ES-module JS, vanilla CSS.

## Running locally

The UI calls the `Ez.Handball.Api` HTTP API. By default it expects the API on `http://localhost:5000`.

1. Start the API (see `Ez.Handball.Backend/`).
2. Serve this directory with any static server:

   ```sh
   npx http-server . -p 5500
   ```

3. Open `http://localhost:5500/?playerId=<id>`.

## Configuration

`window.API_BASE_URL` at the top of `index.html` controls the API base. Edit that line to point at a different host.

## Design spec

See `../Ez.Handball/docs/superpowers/specs/2026-05-21-ez-handball-api-and-ui-design.md`.
