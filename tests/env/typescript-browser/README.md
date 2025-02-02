# TypeScript React demo

## Requirements

Build the base project `/meilisearch-js` as this example uses the locally build bundles from `meilisearch-js`.

```
cd meilisearch-js
pnpm build
```

## Credentials

This example uses the following Meilisearch address: `http://127.0.0.1:7700`. Feel free to change the credentials to meet your Meilisearch address.

The credentials are written in `src/index.ts`.

## Try out

To try it out you need to follow these steps.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Build

```bash
pnpm build
```

### 3. Serve

```bash
http-server public
```

We used http-server CLI to serve the webpage. Feel free to use any tool with the same purpose as it will not impact the result.
