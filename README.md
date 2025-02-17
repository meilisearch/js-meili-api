<p align="center">
  <img src="https://raw.githubusercontent.com/meilisearch/integration-guides/main/assets/logos/meilisearch_js.svg" alt="Meilisearch-JavaScript" width="200" height="200" />
</p>

<h1 align="center">Meilisearch JavaScript</h1>

<h4 align="center">
  <a href="https://github.com/meilisearch/meilisearch">Meilisearch</a> |
  <a href="https://www.meilisearch.com/cloud?utm_campaign=oss&utm_source=github&utm_medium=meilisearch-js">Meilisearch Cloud</a> |
  <a href="https://www.meilisearch.com/docs">Documentation</a> |
  <a href="https://discord.meilisearch.com">Discord</a> |
  <a href="https://roadmap.meilisearch.com/tabs/1-under-consideration">Roadmap</a> |
  <a href="https://www.meilisearch.com">Website</a> |
  <a href="https://www.meilisearch.com/docs/faq">FAQ</a>
</h4>

<p align="center">
  <a href="https://www.npmjs.com/package/meilisearch"><img src="https://img.shields.io/npm/v/meilisearch.svg" alt="npm version"></a>
  <a href="https://github.com/meilisearch/meilisearch-js/actions"><img src="https://github.com/meilisearch/meilisearch-js/workflows/Tests/badge.svg" alt="Tests"></a>
  <a href="https://codecov.io/gh/meilisearch/meilisearch-js"><img src="https://codecov.io/github/meilisearch/meilisearch-js/coverage.svg?branch=main" alt="Codecov"></a>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Prettier"></a>
  <a href="https://github.com/meilisearch/meilisearch-js/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-informational" alt="License"></a>
  <a href="https://ms-bors.herokuapp.com/repositories/10"><img src="https://bors.tech/images/badge_small.svg" alt="Bors enabled"></a>
</p>

<p align="center">⚡ The Meilisearch API client written for JavaScript</p>

**Meilisearch JavaScript** is the Meilisearch API client for JavaScript developers.

**Meilisearch** is an open-source search engine. [Learn more about Meilisearch.](https://github.com/meilisearch/meilisearch)

## Table of Contents <!-- omit in TOC -->

- [📖 Documentation](#-documentation)
- [🔧 Installation](#-installation)
- [🚀 Getting started](#-getting-started)
- [🤖 Compatibility with Meilisearch](#-compatibility-with-meilisearch)
- [💡 Learn more](#-learn-more)
- [⚙️ Contributing](#️-contributing)

## 📖 Documentation

- [client library documentation](https://meilisearch.github.io/meilisearch-js/modules.html)
  ─ information on each exported item of this package
- [main documentation website](https://www.meilisearch.com/docs/) ─ general
  information on how to use Meilisearch—such as our API reference, tutorials,
  guides, and in-depth articles

## 🔧 Installation

This package is published to [npm](https://www.npmjs.com/package/meilisearch).

Installing with `npm`:

```sh
npm i meilisearch
```

> [!NOTE]
>
> Node.js
> [LTS and Maintenance versions](https://github.com/nodejs/Release?tab=readme-ov-file#release-schedule)
> are supported and tested. Other versions may or may not work.

Other runtimes, like Deno and Bun, aren't tested, but if they do not work with
this package, please open an issue.

### Run Meilisearch <!-- omit in toc -->

⚡️ **Launch, scale, and streamline in minutes with Meilisearch Cloud**—no maintenance, no commitment, cancel anytime. [Try it free now](https://cloud.meilisearch.com/login?utm_campaign=oss&utm_source=github&utm_medium=meilisearch-js).

🪨  Prefer to self-host? [Download and deploy](https://www.meilisearch.com/docs/learn/self_hosted/getting_started_with_self_hosted_meilisearch?utm_campaign=oss&utm_source=github&utm_medium=meilisearch-js) our fast, open-source search engine on your own infrastructure.

### Import <!-- omit in toc -->

After installing `meilisearch-js`, you must import it into your application. There are many ways of doing that depending on your development environment.

<details>
<summary><h4>⚠️ If any issues arise importing <code>meilisearch/token</code></h4></summary>

- [TypeScript >= 4.7](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html)
  is required
- [`tsconfig.json` has to be set up correctly](https://www.typescriptlang.org/docs/handbook/modules/reference.html#packagejson-exports)
  - take a look at
    [Centralized Recommendations for TSConfig bases](https://github.com/tsconfig/bases?tab=readme-ov-file)

</details>

> [!WARNING]
>
> - [default export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export#using_the_default_export)
>   is deprecated and will be removed in a future version |
>   [Issue](https://github.com/meilisearch/meilisearch-js/issues/1789)
> - regarding usage of package's UMD version via `script src`, exports will stop
>   being directly available on the
>   [global object](https://developer.mozilla.org/en-US/docs/Glossary/Global_object)
>   | [Issue](https://github.com/meilisearch/meilisearch-js/issues/1806)

#### `import` syntax <!-- omit in toc -->

Usage in an ES module environment:

```js
import { MeiliSearch } from "meilisearch";

const client = new MeiliSearch({
  host: "http://127.0.0.1:7700",
  apiKey: "masterKey",
});
```

#### `<script>` tag <!-- omit in toc -->

This package also contains a [UMD](https://stackoverflow.com/a/77284527) bundled
version, which in this case is meant to be used in a
[`script src`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#src)
tag:

```html
<script src="https://www.unpkg.com/meilisearch/dist/umd/index.min.js"></script>
<script>
    const client = new meilisearch.MeiliSearch(/* ... */);
    // ...
</script>
```

But keep in mind that each CDN ([JSDELIVR](https://www.jsdelivr.com),
[ESM.SH](https://esm.sh/), etc.) provide more ways to import packages, make sure
to read their documentation.

#### `require` syntax <!-- omit in toc -->

Usage in a back-end node.js or another environment supporting CommonJS modules:

```js
const { MeiliSearch } = require("meilisearch");

const client = new MeiliSearch({
  host: "http://127.0.0.1:7700",
  apiKey: "masterKey",
});
```

#### React Native <!-- omit in toc -->

To use `meilisearch-js` with React Native, you must also install [react-native-url-polyfill](https://www.npmjs.com/package/react-native-url-polyfill).

#### Deno<!-- omit in toc -->

Usage in a Deno environment:

```js
import { MeiliSearch } from "npm:meilisearch";

const client = new MeiliSearch({
  host: "http://127.0.0.1:7700",
  apiKey: "masterKey",
});
```

## 🚀 Getting started

Take a look at the [playground](./playgrounds/javascript/src/meilisearch.ts) for a concrete example.

### Add documents <!-- omit in toc -->

```js
const { MeiliSearch } = require('meilisearch')
// Or if you are in a ES environment
import { MeiliSearch } from 'meilisearch'

;(async () => {
  const client = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
    apiKey: 'masterKey',
  })

  // An index is where the documents are stored.
  const index = client.index('movies')

  const documents = [
      { id: 1, title: 'Carol', genres: ['Romance', 'Drama'] },
      { id: 2, title: 'Wonder Woman', genres: ['Action', 'Adventure'] },
      { id: 3, title: 'Life of Pi', genres: ['Adventure', 'Drama'] },
      { id: 4, title: 'Mad Max: Fury Road', genres: ['Adventure', 'Science Fiction'] },
      { id: 5, title: 'Moana', genres: ['Fantasy', 'Action']},
      { id: 6, title: 'Philadelphia', genres: ['Drama'] },
  ]

  // If the index 'movies' does not exist, Meilisearch creates it when you first add the documents.
  let response = await index.addDocuments(documents)

  console.log(response) // => { "uid": 0 }
})()
```

Tasks such as document addition always return a unique identifier. You can use this identifier `taskUid` to check the status (`enqueued`, `canceled`, `processing`, `succeeded` or `failed`) of a [task](https://www.meilisearch.com/docs/reference/api/tasks).

### Basic search <!-- omit in toc -->

```javascript
// Meilisearch is typo-tolerant:
const search = await index.search('philoudelphia')
console.log(search)
```

Output:

```json
{
  "hits": [
    {
      "id": "6",
      "title": "Philadelphia",
      "genres": ["Drama"]
    }
  ],
  "offset": 0,
  "limit": 20,
  "estimatedTotalHits": 1,
  "processingTimeMs": 1,
  "query": "philoudelphia"
}
```

### Using search parameters <!-- omit in toc -->

`meilisearch-js` supports all [search parameters](https://www.meilisearch.com/docs/reference/api/search#search-parameters) described in our main documentation website.

```javascript
await index.search(
  'wonder',
  {
    attributesToHighlight: ['*']
  }
)
```

```json
{
  "hits": [
    {
      "id": 2,
      "title": "Wonder Woman",
      "genres": ["Action", "Adventure"],
      "_formatted": {
        "id": "2",
        "title": "<em>Wonder</em> Woman",
        "genres": ["Action", "Adventure"]
      }
    }
  ],
  "offset": 0,
  "limit": 20,
  "estimatedTotalHits": 1,
  "processingTimeMs": 0,
  "query": "wonder"
}
```

### Custom search with filters <!-- omit in toc -->

To enable filtering, you must first add your attributes to the [`filterableAttributes` index setting](https://www.meilisearch.com/docs/reference/api/settings#filterable-attributes).

```js
await index.updateFilterableAttributes([
    'id',
    'genres'
  ])
```

You only need to perform this operation once per index.

Note that Meilisearch rebuilds your index whenever you update `filterableAttributes`. Depending on the size of your dataset, this might take considerable time. You can track the process using the [tasks API](https://www.meilisearch.com/docs/reference/api/tasks)).

After you configured `filterableAttributes`, you can use the [`filter` search parameter](https://www.meilisearch.com/docs/reference/api/search#filter) to refine your search:

```js
await index.search(
  'wonder',
  {
    filter: ['id > 1 AND genres = Action']
  }
)
```

```json
{
  "hits": [
    {
      "id": 2,
      "title": "Wonder Woman",
      "genres": ["Action","Adventure"]
    }
  ],
  "offset": 0,
  "limit": 20,
  "estimatedTotalHits": 1,
  "processingTimeMs": 0,
  "query": "wonder"
}
```

### Placeholder search <!-- omit in toc -->

Placeholder search makes it possible to receive hits based on your parameters without having any query (`q`). For example, in a movies database you can run an empty query to receive all results filtered by `genre`.

```javascript
await index.search(
  '',
  {
    filter: ['genres = fantasy'],
    facets: ['genres']
  }
)
```

```json
{
  "hits": [
    {
      "id": 2,
      "title": "Wonder Woman",
      "genres": ["Action","Adventure"]
    },
    {
      "id": 5,
      "title": "Moana",
      "genres": ["Fantasy","Action"]
    }
  ],
  "offset": 0,
  "limit": 20,
  "estimatedTotalHits": 2,
  "processingTimeMs": 0,
  "query": "",
  "facetDistribution": {
    "genres": {
      "Action": 2,
      "Fantasy": 1,
      "Adventure": 1
    }
  }
}
```

Note that to enable faceted search on your dataset you need to add `genres` to the `filterableAttributes` index setting. For more information on filtering and faceting, [consult our documentation settings](https://www.meilisearch.com/docs/learn/fine_tuning_results/faceted_search).

#### Abortable search <!-- omit in toc -->

You can abort a pending search request by providing an [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) to the request.

```js
const controller = new AbortController()

index
  .search('wonder', {}, {
    signal: controller.signal,
  })
  .then((response) => {
    /** ... */
  })
  .catch((e) => {
    /** Catch AbortError here. */
  })

controller.abort()
```

### Using Meilisearch behind a proxy <!-- omit in toc -->

#### Custom request config <!-- omit in toc -->

You can provide a custom request configuration. for example, with custom headers.

```ts
const client: MeiliSearch = new MeiliSearch({
  host: 'http://localhost:3000/api/meilisearch/proxy',
  requestConfig: {
    headers: {
      Authorization: AUTH_TOKEN
    },
    // OR
    credentials: 'include'
  }
})
```

#### Custom http client <!-- omit in toc -->

You can use your own HTTP client, for example, with [`axios`](https://github.com/axios/axios).

```ts
const client: MeiliSearch = new MeiliSearch({
  host: 'http://localhost:3000/api/meilisearch/proxy',
  httpClient: async (url, opts) => {
    const response = await $axios.request({
      url,
      data: opts?.body,
      headers: opts?.headers,
      method: (opts?.method?.toLocaleUpperCase() as Method) ?? 'GET'
    })

    return response.data
  }
})
```

## 🤖 Compatibility with Meilisearch

This package guarantees compatibility with [version v1.x of Meilisearch](https://github.com/meilisearch/meilisearch/releases/latest), but some features may not be present. Please check the [issues](https://github.com/meilisearch/meilisearch-js/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22+label%3Aenhancement) for more info.

## 💡 Learn more

The following sections in our main documentation website may interest you:

- **Manipulate documents**: see the [API references](https://www.meilisearch.com/docs/reference/api/documents) or read more about [documents](https://www.meilisearch.com/docs/learn/core_concepts/documents).
- **Search**: see the [API references](https://www.meilisearch.com/docs/reference/api/search) or follow our guide on [search parameters](https://www.meilisearch.com/docs/reference/api/search#search-parameters).
- **Manage the indexes**: see the [API references](https://www.meilisearch.com/docs/reference/api/indexes) or read more about [indexes](https://www.meilisearch.com/docs/learn/core_concepts/indexes).
- **Configure the index settings**: see the [API references](https://www.meilisearch.com/docs/reference/api/settings) or follow our guide on [settings parameters](https://www.meilisearch.com/docs/reference/api/settings#settings_parameters).

This repository also contains [more examples](./examples).

## ⚙️ Contributing

We welcome all contributions, big and small! If you want to know more about this SDK's development workflow or want to contribute to the repo, please visit our [contributing guidelines](/CONTRIBUTING.md) for detailed instructions.

---

Meilisearch provides and maintains many SDKs and integration tools like this one. We want to provide everyone with an **amazing search experience for any kind of project**. For a full overview of everything we create and maintain, take a look at the [integration-guides](https://github.com/meilisearch/integration-guides) repository.
