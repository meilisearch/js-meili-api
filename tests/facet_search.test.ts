import { expect, test, describe, beforeAll, afterAll } from "vitest";
import {
  clearAllIndexes,
  config,
  getClient,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "movies_test",
};

const dataset = [
  {
    id: 123,
    title: "Pride and Prejudice",
    genres: ["romance", "action"],
  },
  {
    id: 456,
    title: "Le Petit Prince",
    genres: ["adventure", "comedy"],
  },
  {
    id: 2,
    title: "Le Rouge et le Noir",
    genres: "romance",
  },
  {
    id: 1,
    title: "Alice In Wonderland",
    genres: ["adventure"],
  },
];

describe.each([
  { permission: "Master" },
  { permission: "Admin" },
  { permission: "Search" },
])("Test on POST search", ({ permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config);
    const client = await getClient("Master");
    const newFilterableAttributes = ["genres", "title"];
    await client.createIndex(index.uid);
    await client.index(index.uid).updateSettings({
      filterableAttributes: newFilterableAttributes,
    });
    await client.index(index.uid).addDocuments(dataset).waitTask();
  });

  test(`${permission} key: basic facet value search`, async () => {
    const client = await getClient(permission);

    const params = {
      facetQuery: "a",
      facetName: "genres",
    };
    const response = await client.index(index.uid).searchForFacetValues(params);

    expect(response).toMatchSnapshot();
  });

  test(`${permission} key: facet value search with no facet query`, async () => {
    const client = await getClient(permission);

    const params = {
      facetName: "genres",
    };
    const response = await client.index(index.uid).searchForFacetValues(params);

    expect(response).toMatchSnapshot();
  });

  test(`${permission} key: facet value search with filter`, async () => {
    const client = await getClient(permission);

    const params = {
      facetName: "genres",
      facetQuery: "a",
      filter: ["genres = action"],
    };

    const response = await client.index(index.uid).searchForFacetValues(params);

    expect(response).toMatchSnapshot();
  });

  test(`${permission} key: facet value search with search query`, async () => {
    const client = await getClient(permission);

    const params = {
      facetName: "genres",
      facetQuery: "a",
      q: "Alice",
    };
    const response = await client.index(index.uid).searchForFacetValues(params);

    // @TODO: This is flaky, processingTimeMs is not guaranteed
    expect(response).toMatchSnapshot();
  });
});

afterAll(() => {
  return clearAllIndexes(config);
});
