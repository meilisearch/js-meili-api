# Contributing

First of all, thank you for contributing to Meilisearch! The goal of this document is to provide everything you need to know in order to contribute to Meilisearch and its different integrations.

<!-- MarkdownTOC autolink="true" style="ordered" indent="   " -->

- [Assumptions](#assumptions)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Git Guidelines](#git-guidelines)
- [Release Process (for internal team only)](#release-process-for-internal-team-only)

<!-- /MarkdownTOC -->

## Assumptions

1. **You're familiar with [GitHub](https://github.com) and the [Pull Request](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests) (PR) workflow.**
2. **You've read the Meilisearch [documentation](https://www.meilisearch.com/docs) and the [README](/README.md).**
3. **You know about the [Meilisearch community](https://discord.com/invite/meilisearch). Please use this for help.**

## How to Contribute

1. Make sure that the contribution you want to make is explained or detailed in a GitHub issue! Find an [existing issue](https://github.com/meilisearch/meilisearch-js/issues/) or [open a new one](https://github.com/meilisearch/meilisearch-js/issues/new).
2. Once done, [fork the meilisearch-js repository](https://help.github.com/en/github/getting-started-with-github/fork-a-repo) in your own GitHub account. Ask a maintainer if you want your issue to be checked before making a PR.
3. [Create a new Git branch](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-and-deleting-branches-within-your-repository).
4. Review the [Development Workflow](#development-workflow) section that describes the steps to maintain the repository.
5. Make the changes on your branch.
6. [Submit the branch as a PR](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/creating-a-pull-request-from-a-fork) pointing to the `main` branch of the main meilisearch-js repository. A maintainer should comment and/or review your Pull Request within a few days. Although depending on the circumstances, it may take longer.<br>
 We do not enforce a naming convention for the PRs, but **please use something descriptive of your changes**, having in mind that the title of your PR will be automatically added to the next [release changelog](https://github.com/meilisearch/meilisearch-js/releases/).

## Development Workflow

### Requirements

To run this project, you will need:

- Node Maintenance or LTS version

### Setup

You can set up your local environment natively or using `docker`, check out the [`docker-compose.yml`](/docker-compose.yml).

Example of running all the checks with docker:
```bash
docker-compose run --rm package bash -c "pnpm install && pnpm test && pnpm lint"
```

To install dependencies:

```bash
pnpm install
```

### Tests and Linter

Each PR should pass the tests and the linter to be accepted.

```bash
# Tests
curl -L https://install.meilisearch.com | sh # download Meilisearch
./meilisearch --master-key=masterKey --no-analytics # run Meilisearch
pnpm test
# Linter
pnpm style
# Linter with fixing
pnpm style:fix
# Build the project
pnpm build
```

## Git Guidelines

### Git Branches

All changes must be made in a branch and submitted as PR.
We do not enforce any branch naming style, but please use something descriptive of your changes.

### Git Commits

As minimal requirements, your commit message should:
- be capitalized
- not finish by a dot or any other punctuation character (!,?)
- start with a verb so that we can read your commit message this way: "This commit will ...", where "..." is the commit message.
  e.g.: "Fix the home page button" or "Add more tests for create_index method"

We don't follow any other convention, but if you want to use one, we recommend [this one](https://chris.beams.io/posts/git-commit/).

### GitHub Pull Requests

Some notes on GitHub PRs:

- [Convert your PR as a draft](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/changing-the-stage-of-a-pull-request) if your changes are a work in progress: no one will review it until you pass your PR as ready for review.<br>
  The draft PR can be very useful if you want to show that you are working on something and make your work visible.
- The branch related to the PR must be **up-to-date with `main`** before merging. Fortunately, this project [integrates a bot](https://github.com/meilisearch/integration-guides/blob/main/resources/bors.md) to automatically enforce this requirement without the PR author having to do it manually.
- All PRs must be reviewed and approved by at least one maintainer.
- The PR title should be accurate and descriptive of the changes. The title of the PR will be indeed automatically added to the next [release changelogs](https://github.com/meilisearch/meilisearch-js/releases/).

## Release Process (for the internal team only)

Meilisearch tools follow the [Semantic Versioning Convention](https://semver.org/).

### Automation to Rebase and Merge the PRs

This project integrates a bot that helps us manage pull requests merging.<br>
_[Read more about this](https://github.com/meilisearch/integration-guides/blob/main/resources/bors.md)._

### Automated Changelogs

This project integrates a tool to create automated changelogs.<br>
_[Read more about this](https://github.com/meilisearch/integration-guides/blob/main/resources/release-drafter.md)._

### How to Publish the Release

⚠️ Before doing anything, make sure you got through the guide about [Releasing an Integration](https://github.com/meilisearch/integration-guides/blob/main/resources/integration-release.md).

#### Version update

Make a PR modifying the following files with the right version:

[`package.json`](/package.json):
```javascript
"version": "X.X.X",
```

[`src/package-version`](/src/package-version.ts)
```javascript
export const PACKAGE_VERSION = 'X.X.X'
```

#### Github publish

Once the changes are merged on `main`, you can publish the current draft release via the [GitHub interface](https://github.com/meilisearch/meilisearch-js/releases): on this page, click on `Edit` (related to the draft release) > update the description (be sure you apply [these recommendations](https://github.com/meilisearch/integration-guides/blob/main/resources/integration-release.md#writting-the-release-description)) > when you are ready, click on `Publish release`.

GitHub Actions will be triggered and push the package to [npm](https://www.npmjs.com/package/meilisearch).

#### Release a `beta` Version

This package is able to create multiple types of betas:
- A standard package beta, working on the latest version of Meilisearch.
- A beta implementing the changes of a rc version of Meilisearch.
- A beta implementing a specific feature `prototype` of Meilisearch.

Here are the steps to release a beta version of this package depending on its type:

1. Create a new branch containing the changes with the correct name format following these rules:
    - `package beta`: create a branch `beta/xx-xx` with the context of your beta.
      Example: `beta/refactor`.
    - Meilisearch `pre-release beta`: create a branch originating from `bump-meilisearch-v*.*.*` named `pre-release-beta/v*.*.*`. <br>
      Example: `pre-release-beta/v0.30.0`
    - Meilisearch `prototype beta`: create a branch `prototype-beta/xx-xx`. Where `xxx` has the same name as the docker image containing the prototype.
        Example: If the [docker image](https://hub.docker.com/r/getmeili/meilisearch/tags) is named: `prototype-multi-search-0`, the branch should be named: `prototype-beta/prototype-multi-search`

2. [Update the version](#version-update) following the correct format (X are numbers):
    - package and prototype beta: `X.X.X-***.X`
      example: `0.2.0-new-feature.0`
    - pre-release beta: `X.X.X-vX.X.X-pre-release.X`
      example: `0.2.0-v0.30.0-pre-release.0`

3. Commit and push your code to the newly created branch (step 1).


4. Go to the [GitHub interface for releasing](https://github.com/meilisearch/meilisearch-js/releases): on this page, click on `Draft a new release`.

5. Create a GitHub pre-release:
  - Fill the description with the detailed changelogs
  - Fill the title with `vX.X.X-beta.0`
  - Fill the tag with `vX.X.X-beta.0`
  - ⚠️ Select the `vX.X.X-beta.0` branch and NOT `main`
  - ⚠️ Click on the "This is a pre-release" checkbox
  - Click on "Publish release"

<hr>

Thank you again for reading this through. We can not wait to begin to work with you if you make your way through this contributing guide ❤️
