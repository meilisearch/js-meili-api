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

**Meilisearch JavaScript** is the Meilisearch API client for JavaScript
developers.

**Meilisearch** is an open-source search engine.
[Learn more about Meilisearch.](https://github.com/meilisearch/meilisearch)

## Run Meilisearch

⚡️ **Launch, scale, and streamline in minutes with Meilisearch Cloud**—no
maintenance, no commitment, cancel anytime.
[Try it free now](https://cloud.meilisearch.com/login?utm_campaign=oss&utm_source=github&utm_medium=meilisearch-js).

🪨 Prefer to self-host?
[Download and deploy](https://www.meilisearch.com/docs/learn/self_hosted/getting_started_with_self_hosted_meilisearch?utm_campaign=oss&utm_source=github&utm_medium=meilisearch-js)
our fast, open-source search engine on your own infrastructure.

## 🔧 Installation

Package is published to [npm](https://www.npmjs.com/package/meilisearch).

Installing with `npm`:

```sh
npm i meilisearch
```

> [!NOTE]
>
> Node.js
> [LTS and Maintenance versions](https://github.com/nodejs/Release?tab=readme-ov-file#release-schedule)
> are supported and tested. Other versions may or may not work.
> [TypeScript has to be set up so that it supports `package.json` `"exports"` field](https://www.typescriptlang.org/docs/handbook/modules/reference.html#packagejson-exports).

Other runtimes, like Deno and Bun, aren't tested, but if they do not work with
this package, please open an issue.

This package also contains a [UMD](https://stackoverflow.com/a/77284527) bundled
version, which is meant to be used in a
[`script src`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#src)
tag:

```html
<script src="https://www.unpkg.com/meilisearch/dist/umd/index.min.js"></script>
<script>
  const client = new meilisearch.MeiliSearch(/* ... */);
  // ...
</script>
```

> [!WARNING]
>
> - [default export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export#using_the_default_export)
>   is deprecated and will be removed in a future version |
>   [Issue](https://github.com/meilisearch/meilisearch-js/issues/1789)
> - regarding usage of package's UMD version via `script src`, exports will stop
>   being directly available on the
>   [global object](https://developer.mozilla.org/en-US/docs/Glossary/Global_object)
>   | [Issue](https://github.com/meilisearch/meilisearch-js/issues/1806)

## 📖 Documentation

Refer to the
[client library documentation](https://meilisearch.github.io/meilisearch-js/modules.html)
for information on each exported item of this package.

For general information on how to use Meilisearch—such as our API reference,
tutorials, guides, and in-depth articles—refer to our
[main documentation website](https://www.meilisearch.com/docs/).

## 🚀 Example code

Take a look at the [playground](./playgrounds/javascript/src/meilisearch.ts) to
see an example.

## 🤖 Compatibility with Meilisearch

This package guarantees compatibility with the
[latest version of Meilisearch](https://github.com/meilisearch/meilisearch/releases/latest).

## ⚙️ Contributing

We welcome all contributions, big and small! If you want to know more about this
SDK's development workflow or want to contribute to the repo, please visit our
[contributing guidelines](/CONTRIBUTING.md) for detailed instructions.

---

Meilisearch provides and maintains many SDKs and integration tools like this
one. We want to provide everyone with an **amazing search experience for any
kind of project**. For a full overview of everything we create and maintain,
take a look at the
[integration-guides](https://github.com/meilisearch/integration-guides)
repository.
