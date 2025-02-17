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
- [📜 API resources](#-api-resources)

## 📖 Documentation

This readme and [Meilisearch JS documentation website](https://meilisearch.github.io/meilisearch-js/) contains all the information you need to start using this Meilisearch SDK.

For general information on how to use Meilisearch—such as our API reference, tutorials, guides, and in-depth articles—refer to our [main documentation website](https://www.meilisearch.com/docs/).

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

## 📜 API resources

### Search <!-- omit in toc -->

#### [Make a search request](https://www.meilisearch.com/docs/reference/api/search)

```ts
client.index<T>('xxx').search(query: string, options: SearchParams = {}, config?: Partial<Request>): Promise<SearchResponse<T>>
```

#### [Make a search request using the GET method (slower than the search method)](https://www.meilisearch.com/docs/reference/api/search#search-in-an-index-with-get-route)

```ts
client.index<T>('xxx').searchGet(query: string, options: SearchParams = {}, config?: Partial<Request>): Promise<SearchResponse<T>>
```

### Multi Search

#### [Make multiple search requests](https://www.meilisearch.com/docs/reference/api/multi_search#multi-search)

```ts
client.multiSearch(queries?: MultiSearchParams, config?: Partial<Request>): Promise<Promise<MultiSearchResponse<T>>>
```

`multiSearch` uses the `POST` method when performing its request to Meilisearch.

### Search For Facet Values

#### [Search for facet values](https://www.meilisearch.com/docs/reference/api/facet_search#perform-a-facet-search)

```ts
client.index<T>('myIndex').searchForFacetValues(params: SearchForFacetValuesParams, config?: Partial<Request>): Promise<SearchForFacetValuesResponse>
```

### Documents <!-- omit in toc -->

#### [Add or replace multiple documents](https://www.meilisearch.com/docs/reference/api/documents#add-or-replace-documents)

```ts
client.index('myIndex').addDocuments(documents: Document<T>[]): Promise<EnqueuedTask>
```

#### [Add or replace multiple documents in string format](https://www.meilisearch.com/docs/reference/api/documents#add-or-update-documents)

```ts
client.index('myIndex').addDocumentsFromString(documents: string, contentType: ContentType, queryParams: RawDocumentAdditionOptions): Promise<EnqueuedTask>
```

#### [Add or replace multiple documents in batches](https://www.meilisearch.com/docs/reference/api/documents#add-or-replace-documents)

```ts
client.index('myIndex').addDocumentsInBatches(documents: Document<T>[], batchSize = 1000): Promise<EnqueuedTask[]>
```

#### [Add or update multiple documents](https://www.meilisearch.com/docs/reference/api/documents#add-or-update-documents)

```ts
client.index('myIndex').updateDocuments(documents: Array<Document<Partial<T>>>): Promise<EnqueuedTask>
```

#### [Add or update multiple documents in string format](https://www.meilisearch.com/docs/reference/api/documents#add-or-update-documents)

```ts
client.index('myIndex').updateDocumentsFromString(documents: string, contentType: ContentType, queryParams: RawDocumentAdditionOptions): Promise<EnqueuedTask>
```

#### [Add or update multiple documents in batches](https://www.meilisearch.com/docs/reference/api/documents#add-or-update-documents)

```ts
client.index('myIndex').updateDocumentsInBatches(documents: Array<Document<Partial<T>>>, batchSize = 1000): Promise<EnqueuedTask[]>
```

#### [Get Documents](https://www.meilisearch.com/docs/reference/api/documents#get-documents)

```ts
client.index.getDocuments(parameters: DocumentsQuery = {}): Promise<DocumentsResults<T>>>
```

#### [Get one document](https://www.meilisearch.com/docs/reference/api/documents#get-one-document)

```ts
client.index('myIndex').getDocument(documentId: string): Promise<Document<T>>
```

#### [Delete one document](https://www.meilisearch.com/docs/reference/api/documents#delete-one-document)

```ts
client.index('myIndex').deleteDocument(documentId: string | number): Promise<EnqueuedTask>
```

#### [Delete multiple documents](https://www.meilisearch.com/docs/reference/api/documents#delete-documents)

```ts
client.index('myIndex').deleteDocuments(params: DocumentsDeletionQuery | DocumentsIds): Promise<EnqueuedTask>
```

#### [Delete all documents](https://www.meilisearch.com/docs/reference/api/documents#delete-all-documents)

```ts
client.index('myIndex').deleteAllDocuments(): Promise<Types.EnqueuedTask>
```

### Tasks <!-- omit in toc -->

#### [Get all tasks](https://www.meilisearch.com/docs/reference/api/tasks#get-all-tasks)

```ts
client.getTasks(parameters: TasksQuery): Promise<TasksResults>
```

#### [Get one task](https://www.meilisearch.com/docs/reference/api/tasks)

```ts
client.getTask(uid: number): Promise<Task>
```

#### [Delete tasks](https://www.meilisearch.com/docs/reference/api/tasks#delete-tasks)

```ts
client.deleteTasks(parameters: DeleteTasksQuery = {}): Promise<EnqueuedTask>
```

#### [Cancel tasks](https://www.meilisearch.com/docs/reference/api/tasks#cancel-tasks)

```ts
client.cancelTasks(parameters: CancelTasksQuery = {}): Promise<EnqueuedTask>
```

#### [Get all tasks of an index](https://www.meilisearch.com/docs/reference/api/tasks#get-all-tasks-by-index)

```ts
client.index('myIndex').getTasks(parameters: TasksQuery): Promise<TasksResults>
```

#### [Get one task of an index](https://www.meilisearch.com/docs/reference/api/tasks)

```ts
client.index('myIndex').getTask(uid: number): Promise<Task>
```


#### Wait for one task


##### Using the client

```ts
client.waitForTask(uid: number, { timeOutMs?: number, intervalMs?: number }): Promise<Task>
```

##### Using the index

```ts
client.index('myIndex').waitForTask(uid: number, { timeOutMs?: number, intervalMs?: number }): Promise<Task>
```

#### Wait for multiple tasks

##### Using the client

```ts
client.waitForTasks(uids: number[], { timeOutMs?: number, intervalMs?: number }): Promise<Task[]>
```

##### Using the index

```ts
client.index('myIndex').waitForTasks(uids: number[], { timeOutMs?: number, intervalMs?: number }): Promise<Task[]>
```

### Batches <!-- omit in toc -->

#### [Get one batch](https://www.meilisearch.com/docs/reference/api/batches#get-one-batch)

```ts
client.getBatch(uid: number): Promise<Batch>
```

#### [Get all batches](https://www.meilisearch.com/docs/reference/api/batchess#get-batches)

```ts
client.getBatches(parameters: BatchesQuery = {}): Promise<BatchesResults>
```

### Indexes <!-- omit in toc -->

#### [Get all indexes in Index instances](https://www.meilisearch.com/docs/reference/api/indexes#list-all-indexes)

```ts
client.getIndexes(parameters: IndexesQuery): Promise<IndexesResults<Index[]>>
```

#### [Get all indexes](https://www.meilisearch.com/docs/reference/api/indexes#list-all-indexes)

```ts
client.getRawIndexes(parameters: IndexesQuery): Promise<IndexesResults<IndexObject[]>>
```


#### [Create a new index](https://www.meilisearch.com/docs/reference/api/indexes#create-an-index)

```ts
client.createIndex<T>(uid: string, options?: IndexOptions): Promise<EnqueuedTask>
```

#### Create a local reference to an index

```ts
client.index<T>(uid: string): Index<T>
```

#### [Get an index instance completed with information fetched from Meilisearch](https://www.meilisearch.com/docs/reference/api/indexes#get-one-index)

```ts
client.getIndex<T>(uid: string): Promise<Index<T>>
```

#### [Get the raw index JSON response from Meilisearch](https://www.meilisearch.com/docs/reference/api/indexes#get-one-index)

```ts
client.getRawIndex(uid: string): Promise<IndexObject>
```

#### [Get an object with information about the index](https://www.meilisearch.com/docs/reference/api/indexes#get-one-index)

```ts
client.index('myIndex').getRawInfo(): Promise<IndexObject>
```

#### [Update Index](https://www.meilisearch.com/docs/reference/api/indexes#update-an-index)

##### Using the client

```ts
client.updateIndex(uid: string, options: IndexOptions): Promise<EnqueuedTask>
```

##### Using the index object

```ts
client.index('myIndex').update(data: IndexOptions): Promise<EnqueuedTask>
```

#### [Delete index](https://www.meilisearch.com/docs/reference/api/indexes#delete-an-index)

##### Using the client
```ts
client.deleteIndex(uid): Promise<void>
```

##### Using the index object
```ts
client.index('myIndex').delete(): Promise<void>
```

#### [Get specific index stats](https://www.meilisearch.com/docs/reference/api/stats#get-stats-of-an-index)

```ts
client.index('myIndex').getStats(): Promise<IndexStats>
```

##### Return Index instance with updated information

```ts
client.index('myIndex').fetchInfo(): Promise<Index>
```

##### Get Primary Key of an Index

```ts
client.index('myIndex').fetchPrimaryKey(): Promise<string | undefined>
```

##### Swap two indexes

```ts
client.swapIndexes(params: SwapIndexesParams): Promise<EnqueuedTask>
```

### Settings <!-- omit in toc -->

#### [Get settings](https://www.meilisearch.com/docs/reference/api/settings#get-settings)

```ts
client.index('myIndex').getSettings(): Promise<Settings>
```

#### [Update settings](https://www.meilisearch.com/docs/reference/api/settings#update-settings)

```ts
client.index('myIndex').updateSettings(settings: Settings): Promise<EnqueuedTask>
```

#### [Reset settings](https://www.meilisearch.com/docs/reference/api/settings#reset-settings)

```ts
client.index('myIndex').resetSettings(): Promise<EnqueuedTask>
```

### Pagination Settings

#### [Get pagination](https://www.meilisearch.com/docs/reference/api/settings#get-pagination-settings)

```ts
client.index('myIndex').getPagination(): Promise<PaginationSettings>
```

#### [Update pagination](https://www.meilisearch.com/docs/reference/api/settings#update-pagination-settings)

```ts
client.index('myIndex').updatePagination(pagination: PaginationSettings): Promise<EnqueuedTask>
```

#### [Reset pagination](https://www.meilisearch.com/docs/reference/api/settings#reset-pagination-settings)

```ts
client.index('myIndex').resetPagination(): Promise<EnqueuedTask>
```

### Synonyms <!-- omit in toc -->

#### [Get synonyms](https://www.meilisearch.com/docs/reference/api/settings#get-synonyms)

```ts
client.index('myIndex').getSynonyms(): Promise<Synonyms>
```

#### [Update synonyms](https://www.meilisearch.com/docs/reference/api/settings#update-synonyms)

```ts
client.index('myIndex').updateSynonyms(synonyms: Synonyms): Promise<EnqueuedTask>
```

#### [Reset synonyms](https://www.meilisearch.com/docs/reference/api/settings#reset-synonyms)

```ts
client.index('myIndex').resetSynonyms(): Promise<EnqueuedTask>
```

### Stop words <!-- omit in toc -->

#### [Get stop words](https://www.meilisearch.com/docs/reference/api/settings#get-stop-words)

```ts
client.index('myIndex').getStopWords(): Promise<string[]>
```

#### [Update stop words](https://www.meilisearch.com/docs/reference/api/settings#update-stop-words)

```ts
client.index('myIndex').updateStopWords(stopWords: string[] | null ): Promise<EnqueuedTask>
```

#### [Reset stop words](https://www.meilisearch.com/docs/reference/api/settings#reset-stop-words)

```ts
client.index('myIndex').resetStopWords(): Promise<EnqueuedTask>
```

### Ranking rules <!-- omit in toc -->

#### [Get ranking rules](https://www.meilisearch.com/docs/reference/api/settings#get-ranking-rules)

```ts
client.index('myIndex').getRankingRules(): Promise<string[]>
```

#### [Update ranking rules](https://www.meilisearch.com/docs/reference/api/settings#update-ranking-rules)

```ts
client.index('myIndex').updateRankingRules(rankingRules: string[] | null): Promise<EnqueuedTask>
```

#### [Reset ranking rules](https://www.meilisearch.com/docs/reference/api/settings#reset-ranking-rules)

```ts
client.index('myIndex').resetRankingRules(): Promise<EnqueuedTask>
```

### Distinct Attribute <!-- omit in toc -->

#### [Get distinct attribute](https://www.meilisearch.com/docs/reference/api/settings#get-distinct-attribute)

```ts
client.index('myIndex').getDistinctAttribute(): Promise<string | void>
```

#### [Update distinct attribute](https://www.meilisearch.com/docs/reference/api/settings#update-distinct-attribute)

```ts
client.index('myIndex').updateDistinctAttribute(distinctAttribute: string | null): Promise<EnqueuedTask>
```

#### [Reset distinct attribute](https://www.meilisearch.com/docs/reference/api/settings#reset-distinct-attribute)

```ts
client.index('myIndex').resetDistinctAttribute(): Promise<EnqueuedTask>
```

### Searchable attributes <!-- omit in toc -->

#### [Get searchable attributes](https://www.meilisearch.com/docs/reference/api/settings#get-searchable-attributes)

```ts
client.index('myIndex').getSearchableAttributes(): Promise<string[]>
```

#### [Update searchable attributes](https://www.meilisearch.com/docs/reference/api/settings#update-searchable-attributes)

```ts
client.index('myIndex').updateSearchableAttributes(searchableAttributes: string[] | null): Promise<EnqueuedTask>
```

#### [Reset searchable attributes](https://www.meilisearch.com/docs/reference/api/settings#reset-searchable-attributes)

```ts
client.index('myIndex').resetSearchableAttributes(): Promise<EnqueuedTask>
```

### Displayed attributes <!-- omit in toc -->

#### [Get displayed attributes](https://www.meilisearch.com/docs/reference/api/settings#get-displayed-attributes)

```ts
client.index('myIndex').getDisplayedAttributes(): Promise<string[]>
```

#### [Update displayed attributes](https://www.meilisearch.com/docs/reference/api/settings#update-displayed-attributes)

```ts
client.index('myIndex').updateDisplayedAttributes(displayedAttributes: string[] | null): Promise<EnqueuedTask>
```

#### [Reset displayed attributes](https://www.meilisearch.com/docs/reference/api/settings#reset-displayed-attributes)

```ts
client.index('myIndex').resetDisplayedAttributes(): Promise<EnqueuedTask>
```

### Filterable attributes <!-- omit in toc -->

#### [Get filterable attributes](https://www.meilisearch.com/docs/reference/api/settings#get-filterable-attributes)

```ts
client.index('myIndex').getFilterableAttributes(): Promise<string[]>
```

#### [Update filterable attributes](https://www.meilisearch.com/docs/reference/api/settings#update-filterable-attributes)

```ts
client.index('myIndex').updateFilterableAttributes(filterableAttributes: string[] | null): Promise<EnqueuedTask>
```

#### [Reset filterable attributes](https://www.meilisearch.com/docs/reference/api/settings#reset-filterable-attributes)

```ts
client.index('myIndex').resetFilterableAttributes(): Promise<EnqueuedTask>
```

### Sortable attributes <!-- omit in toc -->

#### [Get sortable attributes](https://www.meilisearch.com/docs/reference/api/settings#get-sortable-attributes)

```ts
client.index('myIndex').getSortableAttributes(): Promise<string[]>
```

#### [Update sortable attributes](https://www.meilisearch.com/docs/reference/api/settings#update-sortable-attributes)

```ts
client.index('myIndex').updateSortableAttributes(sortableAttributes: string[] | null): Promise<EnqueuedTask>
```

#### [Reset sortable attributes](https://www.meilisearch.com/docs/reference/api/settings#reset-sortable-attributes)

```ts
client.index('myIndex').resetSortableAttributes(): Promise<EnqueuedTask>
```

### Faceting <!-- omit in toc -->

#### [Get faceting](https://www.meilisearch.com/docs/reference/api/settings#get-faceting-settings)

```ts
client.index('myIndex').getFaceting(): Promise<Faceting>
```

#### [Update faceting](https://www.meilisearch.com/docs/reference/api/settings#update-faceting-settings)

```ts
client.index('myIndex').updateFaceting(faceting: Faceting): Promise<EnqueuedTask>
```

#### [Reset faceting](https://www.meilisearch.com/docs/reference/api/settings#reset-faceting-settings)

```ts
client.index('myIndex').resetFaceting(): Promise<EnqueuedTask>
```

### Typo tolerance <!-- omit in toc -->

#### [Get typo tolerance](https://www.meilisearch.com/docs/reference/api/settings#get-typo-tolerance-settings)

```ts
client.index('myIndex').getTypoTolerance(): Promise<TypoTolerance>
```

#### [Update typo tolerance](https://www.meilisearch.com/docs/reference/api/settings#update-typo-tolerance-settings)

```ts
client.index('myIndex').updateTypoTolerance(typoTolerance: TypoTolerance | null): Promise<EnqueuedTask>
```

#### [Reset typo tolerance](https://www.meilisearch.com/docs/reference/api/settings#reset-typo-tolerance-settings)

```ts
client.index('myIndex').resetTypoTolerance(): Promise<EnqueuedTask>
```


### Separator tokens <!-- omit in toc -->

#### [Get separator tokens](https://www.meilisearch.com/docs/reference/api/settings#get-separator-tokens)

```ts
client.index('myIndex').getSeparatorTokens(): Promise<SeparatorTokens>
```

#### [Update separator tokens](https://www.meilisearch.com/docs/reference/api/settings#update-separator-tokens)

```ts
client.index('myIndex').updateSeparatorTokens(separatorTokens: SeparatorTokens | null): Promise<EnqueuedTask>
```

#### [Reset separator tokens](https://www.meilisearch.com/docs/reference/api/settings#reset-separator-tokens)

```ts
client.index('myIndex').resetSeparatorTokens(): Promise<EnqueuedTask>
```

### Non Separator tokens <!-- omit in toc -->

#### [Get non separator tokens](https://www.meilisearch.com/docs/reference/api/settings#get-non-separator-tokens)

```ts
client.index('myIndex').getNonSeparatorTokens(): Promise<NonSeparatorTokens>
```

#### [Update non separator tokens](https://www.meilisearch.com/docs/reference/api/settings#update-non-separator-tokens)

```ts
client.index('myIndex').updateNonSeparatorTokens(nonSeparatorTokens: NonSeparatorTokens | null): Promise<EnqueuedTask>
```

#### [Reset non separator tokens](https://www.meilisearch.com/docs/reference/api/settings#reset-non-separator-tokens)

```ts
client.index('myIndex').resetNonSeparatorTokens(): Promise<EnqueuedTask>
```

### Dictionary <!-- omit in toc -->

#### [Get dictionary](https://www.meilisearch.com/docs/reference/api/settings#get-dictionary)

```ts
client.index('myIndex').getDictionary(): Promise<Dictionary>
```

#### [Update dictionary](https://www.meilisearch.com/docs/reference/api/settings#update-dictionary)

```ts
client.index('myIndex').updateDictionary(dictionary: Dictionary | null): Promise<EnqueuedTask>
```

#### [Reset dictionary](https://www.meilisearch.com/docs/reference/api/settings#reset-dictionary)

```ts
client.index('myIndex').resetDictionary(): Promise<EnqueuedTask>
```

### Proximity Precision <!-- omit in toc -->

#### [Get proximity precision](https://www.meilisearch.com/docs/reference/api/settings#get-proximity-precision-settings)

```ts
client.index('myIndex').getProximityPrecision(): Promise<ProximityPrecision>
```

#### [Update proximity precision](https://www.meilisearch.com/docs/reference/api/settings#update-proximity-precision-settings)

```ts
client.index('myIndex').updateProximityPrecision(proximityPrecision: ProximityPrecision): Promise<EnqueuedTask>
```

#### [Reset proximity precision](https://www.meilisearch.com/docs/reference/api/settings#reset-proximity-precision-settings)

```ts
client.index('myIndex').resetProximityPrecision(): Promise<EnqueuedTask>
```

### Facet search settings <!-- omit in toc -->

#### [Get facet search settings](https://www.meilisearch.com/docs/reference/api/settings#get-facet-search-settings)

```ts
client.index('myIndex').getFacetSearch(): Promise<boolean>
```

#### [Update facet search settings](https://www.meilisearch.com/docs/reference/api/settings#update-facet-search-settings)

```ts
client.index('myIndex').updateFacetSearch(enabled: boolean): Promise<EnqueuedTask>
```

#### [Reset facet search settings](https://www.meilisearch.com/docs/reference/api/settings#reset-facet-search-settings)

```ts
client.index('myIndex').resetFacetSearch(): Promise<EnqueuedTask>
```

### Prefix search settings <!-- omit in toc -->

#### [Get prefix search settings](https://www.meilisearch.com/docs/reference/api/settings#get-prefix-search-settings)

```ts
client.index('myIndex').getPrefixSearch(): Promise<PrefixSearch>
```

#### [Update prefix search settings](https://www.meilisearch.com/docs/reference/api/settings#update-prefix-search-settings)

```ts
client.index('myIndex').updatePrefixSearch(prefixSearch: PrefixSearch): Promise<EnqueuedTask>
```

#### [Reset prefix search settings](https://www.meilisearch.com/docs/reference/api/settings#reset-prefix-search-settings)

```ts
client.index('myIndex').resetPrefixSearch(): Promise<EnqueuedTask>
```

### Embedders <!-- omit in toc -->

#### Get embedders

```ts
client.index('myIndex').getEmbedders(): Promise<Embedders>
```

#### Update embedders

```ts
client.index('myIndex').updateEmbedders(embedders: Embedders): Promise<EnqueuedTask>
```

#### Reset embedders

```ts
client.index('myIndex').resetEmbedders(): Promise<EnqueuedTask>
```

### SearchCutoffMs <!-- omit in toc -->

#### [Get SearchCutoffMs](https://www.meilisearch.com/docs/reference/api/settings#get-search-cutoff)

```ts
client.index('myIndex').getSearchCutoffMs(): Promise<SearchCutoffMs>
```

#### [Update SearchCutoffMs](https://www.meilisearch.com/docs/reference/api/settings#update-search-cutoff)

```ts
client.index('myIndex').updateSearchCutoffMs(searchCutoffMs: SearchCutoffMs): Promise<EnqueuedTask>
```

#### [Reset SearchCutoffMs](https://www.meilisearch.com/docs/reference/api/settings#reset-search-cutoff)

```ts
client.index('myIndex').resetSearchCutoffMs(): Promise<EnqueuedTask>
```

### Keys <!-- omit in toc -->

#### [Get keys](https://www.meilisearch.com/docs/reference/api/keys#get-all-keys)

```ts
client.getKeys(parameters: KeysQuery): Promise<KeysResults>
```

#### [Get one key](https://www.meilisearch.com/docs/reference/api/keys#get-one-key)

```ts
client.getKey(keyOrUid: string): Promise<Key>
```

#### [Create a key](https://www.meilisearch.com/docs/reference/api/keys#create-a-key)

```ts
client.createKey(options: KeyCreation): Promise<Key>
```

#### [Update a key](https://www.meilisearch.com/docs/reference/api/keys#update-a-key)

```ts
client.updateKey(keyOrUid: string, options: KeyUpdate): Promise<Key>
```

#### [Delete a key](https://www.meilisearch.com/docs/reference/api/keys#delete-a-key)

```ts
client.deleteKey(keyOrUid: string): Promise<void>
```

### `isHealthy` <!-- omit in toc -->

#### [Return `true` or `false` depending on the health of the server](https://www.meilisearch.com/docs/reference/api/health#get-health)

```ts
client.isHealthy(): Promise<boolean>
```

### Health <!-- omit in toc -->

#### [Check if the server is healthy](https://www.meilisearch.com/docs/reference/api/health#get-health)

```ts
client.health(): Promise<Health>
```

### Stats <!-- omit in toc -->

#### [Get database stats](https://www.meilisearch.com/docs/reference/api/stats#get-stats-of-all-indexes)

```ts
client.getStats(): Promise<Stats>
```

### Version <!-- omit in toc -->

#### [Get binary version](https://www.meilisearch.com/docs/reference/api/version#get-version-of-meilisearch)

```ts
client.getVersion(): Promise<Version>
```

### Dumps <!-- omit in toc -->

#### [Trigger a dump creation process](https://www.meilisearch.com/docs/reference/api/dump#create-a-dump)

```ts
client.createDump(): Promise<EnqueuedTask>
```

### Snapshots <!-- omit in toc -->

#### [Trigger a snapshot on-demand process](https://www.meilisearch.com/docs/reference/api/snapshots#create-a-snapshot)

```ts
client.createSnapshot(): Promise<EnqueuedTask>
```

---

Meilisearch provides and maintains many SDKs and integration tools like this one. We want to provide everyone with an **amazing search experience for any kind of project**. For a full overview of everything we create and maintain, take a look at the [integration-guides](https://github.com/meilisearch/integration-guides) repository.
