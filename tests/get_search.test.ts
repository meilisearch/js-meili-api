import { expect, test, describe, afterAll, beforeAll } from "vitest";
import { ErrorStatusCode } from "../src/types.js";
import { EnqueuedTask } from "../src/enqueued-task.js";
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "movies_test",
};
const emptyIndex = {
  uid: "empty_test",
};

const dataset = [
  {
    id: 123,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    comment: "A great book",
    genre: ["romance"],
  },
  {
    id: 456,
    title: "Le Petit Prince",
    author: "Antoine de Saint-Exupéry",
    comment: "A french book about a prince that walks on little cute planets",
    genre: ["adventure"],
  },
  {
    id: 2,
    title: "Le Rouge et le Noir",
    author: "Stendhal",
    comment: "Another french book",
    genre: ["romance"],
  },
  {
    id: 1,
    title: "Alice In Wonderland",
    author: "Lewis Carroll",
    comment: "A weird book",
    genre: ["adventure"],
  },
  {
    id: 1344,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    comment: "An awesome book",
    genre: ["fantasy", "adventure"],
  },
  {
    id: 4,
    title: "Harry Potter and the Half-Blood Prince",
    author: "J.K. Rowling",
    comment: "The best book",
    genre: ["fantasy", "adventure"],
  },
  {
    id: 5,
    title: "Harry Potter and the Deathly Hallows",
    author: "J.K. Rowling",
    genre: ["fantasy", "adventure"],
  },
  {
    id: 42,
    title: "The Hitchhiker's Guide to the Galaxy",
    author: "Douglas Adams",
    genre: ["sci fi", "comedy"],
  },
];

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([
  { permission: "Master" },
  { permission: "Admin" },
  { permission: "Search" },
])("Test on GET search", ({ permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config);
    const client = await getClient("Master");
    const { taskUid: task1 } = await client.createIndex(index.uid);
    await client.waitForTask(task1);
    const { taskUid: task2 } = await client.createIndex(emptyIndex.uid);
    await client.waitForTask(task2);

    const newFilterableAttributes = ["genre", "title", "id", "author"];
    const { taskUid: task3 }: EnqueuedTask = await client
      .index(index.uid)
      .updateSettings({
        filterableAttributes: newFilterableAttributes,
        sortableAttributes: ["id"],
      });
    await client.waitForTask(task3);

    const { taskUid: task4 } = await client
      .index(index.uid)
      .addDocuments(dataset);
    await client.waitForTask(task4);
  });

  test(`${permission} key: Basic search`, async () => {
    const client = await getClient(permission);

    const response = await client.index(index.uid).searchGet("prince", {});

    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    expect(response).toHaveProperty("limit", 20);
    expect(response).toHaveProperty("offset", 0);
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response).toHaveProperty("query", "prince");
    expect(response.hits.length).toEqual(2);
  });

  test(`${permission} key: search with options`, async () => {
    const client = await getClient(permission);
    const response = await client
      .index(index.uid)
      .searchGet("prince", { limit: 1 });
    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    expect(response).toHaveProperty("offset", 0);
    expect(response).toHaveProperty("limit", 1);
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response).toHaveProperty("query", "prince");
    expect(response.hits.length).toEqual(1);
  });

  test(`${permission} key: search with sortable`, async () => {
    const client = await getClient(permission);
    const response = await client
      .index(index.uid)
      .search("", { sort: ["id:asc"] });
    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    const hit = response.hits[0];
    expect(hit.id).toEqual(1);
  });

  test(`${permission} key: search with array options`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("prince", {
      attributesToRetrieve: ["*"],
    });
    const hit = response.hits[0];

    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    expect(response).toHaveProperty("query", "prince");
    expect(Object.keys(hit).join(",")).toEqual(
      Object.keys(dataset[1]).join(","),
    );
  });

  test(`${permission} key: search on attributesToSearchOn`, async () => {
    const client = await getClient(permission);

    const response = await client.index(index.uid).searchGet("prince", {
      attributesToSearchOn: ["id"],
    });

    expect(response.hits.length).toEqual(0);
  });

  test(`${permission} key: search on attributesToSearchOn set to null`, async () => {
    const client = await getClient(permission);

    const response = await client.index(index.uid).searchGet("prince", {
      attributesToSearchOn: null,
    });

    expect(response).toMatchSnapshot();
  });

  test(`${permission} key: search with options`, async () => {
    const client = await getClient(permission);
    const response = await client
      .index(index.uid)
      .searchGet("prince", { limit: 1 });
    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    expect(response).toHaveProperty("offset", 0);
    expect(response).toHaveProperty("limit", 1);
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response).toHaveProperty("query", "prince");
    expect(response.hits.length).toEqual(1);
  });

  test(`${permission} key: search with limit and offset`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("prince", {
      limit: 1,
      offset: 1,
    });
    expect(response).toHaveProperty("hits", [
      {
        id: 4,
        title: "Harry Potter and the Half-Blood Prince",
        author: "J.K. Rowling",
        comment: "The best book",
        genre: ["fantasy", "adventure"],
      },
    ]);
    expect(response).toHaveProperty("offset", 1);
    expect(response).toHaveProperty("limit", 1);
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response).toHaveProperty("query", "prince");
    expect(response.hits.length).toEqual(1);
  });

  test(`${permission} key: search with matches parameter and small croplength`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("prince", {
      filter: 'title = "Le Petit Prince"',
      attributesToCrop: ["*"],
      cropLength: 5,
      showMatchesPosition: true,
    });
    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    expect(response.hits[0]).toHaveProperty("_matchesPosition", {
      comment: [{ start: 22, length: 6 }],
      title: [{ start: 9, length: 6 }],
    });
  });

  test(`${permission} key: search with all options but not all fields`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("prince", {
      limit: 5,
      offset: 0,
      attributesToRetrieve: ["id", "title"],
      attributesToCrop: ["*"],
      cropLength: 6,
      attributesToHighlight: ["*"],
      filter: 'title = "Le Petit Prince"',
      showMatchesPosition: true,
    });

    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    expect(response).toHaveProperty("offset", 0);
    expect(response).toHaveProperty("limit", 5);
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response).toHaveProperty("query", "prince");
    expect(response.hits[0]._formatted).toHaveProperty("title");
    expect(response.hits[0]._formatted).toHaveProperty("id");
    expect(response.hits[0]).not.toHaveProperty("comment");
    expect(response.hits[0]).not.toHaveProperty("description");
    expect(response.hits.length).toEqual(1);
    expect(response.hits[0]).toHaveProperty("_formatted", expect.any(Object));
    expect(response.hits[0]._formatted).toHaveProperty(
      "title",
      "Le Petit <em>Prince</em>",
    );
    expect(response.hits[0]).toHaveProperty(
      "_matchesPosition",
      expect.any(Object),
    );
  });

  test(`${permission} key: search on default cropping parameters`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("prince", {
      attributesToCrop: ["*"],
      cropLength: 6,
    });

    expect(response.hits[0]._formatted).toHaveProperty(
      "comment",
      "…book about a prince that walks…",
    );
  });

  test(`${permission} key: search on customized cropMarker`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("prince", {
      attributesToCrop: ["*"],
      cropLength: 6,
      cropMarker: "(ꈍᴗꈍ)",
    });

    expect(response.hits[0]._formatted).toHaveProperty(
      "comment",
      "(ꈍᴗꈍ)book about a prince that walks(ꈍᴗꈍ)",
    );
  });

  test(`${permission} key: search on customized highlight tags`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("prince", {
      attributesToHighlight: ["*"],
      highlightPreTag: "(⊃｡•́‿•̀｡)⊃ ",
      highlightPostTag: " ⊂(´• ω •`⊂)",
    });

    expect(response.hits[0]._formatted).toHaveProperty(
      "comment",
      "A french book about a (⊃｡•́‿•̀｡)⊃ prince ⊂(´• ω •`⊂) that walks on little cute planets",
    );
  });

  test(`${permission} key: search with all options and all fields`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("prince", {
      limit: 5,
      offset: 0,
      attributesToRetrieve: ["*"],
      attributesToCrop: ["*"],
      cropLength: 6,
      attributesToHighlight: ["*"],
      filter: 'title = "Le Petit Prince"',
      showMatchesPosition: true,
    });
    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    expect(response).toHaveProperty("offset", 0);
    expect(response).toHaveProperty("limit", 5);
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response).toHaveProperty("query", "prince");
    expect(response.hits.length).toEqual(1);
    expect(response.hits[0]).toHaveProperty("_formatted", expect.any(Object));
    expect(response.hits[0]._formatted).toHaveProperty(
      "title",
      "Le Petit <em>Prince</em>",
    );
    expect(response.hits[0]).toHaveProperty(
      "_matchesPosition",
      expect.any(Object),
    );
  });

  test(`${permission} key: search with all options but specific fields`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("prince", {
      limit: 5,
      offset: 0,
      attributesToRetrieve: ["id", "title"],
      attributesToCrop: ["id", "title"],
      cropLength: 6,
      attributesToHighlight: ["id", "title"],
      filter: 'title = "Le Petit Prince"',
      showMatchesPosition: true,
    });
    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    expect(response).toHaveProperty("offset", 0);
    expect(response).toHaveProperty("limit", 5);
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response).toHaveProperty("query", "prince");
    expect(response.hits.length).toEqual(1);
    expect(response.hits[0]).toHaveProperty("id", 456);
    expect(response.hits[0]).toHaveProperty("title", "Le Petit Prince");
    expect(response.hits[0]).not.toHaveProperty("comment");
    expect(response.hits[0]).toHaveProperty("_formatted", expect.any(Object));
    expect(response.hits[0]).not.toHaveProperty(
      "description",
      expect.any(Object),
    );
    expect(response.hits[0]._formatted).toHaveProperty(
      "title",
      "Le Petit <em>Prince</em>",
    );
    expect(response.hits[0]._formatted).not.toHaveProperty("comment");
    expect(response.hits[0]).toHaveProperty(
      "_matchesPosition",
      expect.any(Object),
    );
  });

  test(`${permission} key: search with filter and facetDistribution`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("a", {
      filter: "genre = romance",
      facets: ["genre"],
    });
    expect(response).toHaveProperty("facetDistribution", {
      genre: { romance: 2 },
    });
    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    expect(response.hits.length).toEqual(2);
  });

  test(`${permission} key: search with filter on number`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("a", {
      filter: "id < 0",
      facets: ["genre"],
    });
    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    expect(response.hits.length).toEqual(0);
  });

  test(`${permission} key: search with filter with spaces`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("h", {
      filter: 'genre = "sci fi"',
    });
    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    expect(response.hits.length).toEqual(1);
  });

  test(`${permission} key: search with multiple filter`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("a", {
      filter: "genre = romance AND (genre = romance OR genre = romance)",
      facets: ["genre"],
    });
    expect(response).toHaveProperty("facetDistribution", {
      genre: { romance: 2 },
    });
    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    expect(response.hits.length).toEqual(2);
  });

  test(`${permission} key: search with multiple filter and undefined query (placeholder)`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet(undefined, {
      filter: "genre = fantasy",
      facets: ["genre"],
    });
    expect(response).toHaveProperty("facetDistribution", {
      genre: { adventure: 3, fantasy: 3 },
    });
    expect(response.hits.length).toEqual(3);
  });

  test(`${permission} key: search with multiple filter and null query (placeholder)`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet(null, {
      filter: "genre = fantasy",
      facets: ["genre"],
    });
    expect(response).toHaveProperty("facetDistribution", {
      genre: {
        adventure: 3,
        fantasy: 3,
      },
    });
    expect(response.hits.length).toEqual(3);
    expect(response.estimatedTotalHits).toEqual(3);
  });

  test(`${permission} key: search with multiple filter and empty string query (placeholder)`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("", {
      filter: "genre = fantasy",
      facets: ["genre"],
    });

    expect(response).toHaveProperty("facetDistribution", {
      genre: { adventure: 3, fantasy: 3 },
    });
    expect(response.hits.length).toEqual(3);
  });

  test(`${permission} key: Try to search with wrong format filter`, async () => {
    const client = await getClient(permission);
    await expect(
      client.index(index.uid).searchGet("prince", {
        filter: ["hello"],
      }),
    ).rejects.toHaveProperty(
      "message",
      "The filter query parameter should be in string format when using searchGet",
    );
  });

  test(`${permission} key: search without vectors`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("prince", {});

    expect(response).not.toHaveProperty("semanticHitCount");
  });

  test(`${permission} key: search with rankingScoreThreshold filter`, async () => {
    const client = await getClient(permission);

    const response = await client.index(index.uid).searchGet("prince", {
      showRankingScore: true,
      rankingScoreThreshold: 0.8,
    });

    const hit = response.hits[0];

    expect(response).toHaveProperty("hits", expect.any(Array));
    expect(response).toHaveProperty("query", "prince");
    expect(hit).toHaveProperty("_rankingScore");
    expect(hit["_rankingScore"]).toBeGreaterThanOrEqual(0.8);

    const response2 = await client.index(index.uid).search("prince", {
      showRankingScore: true,
      rankingScoreThreshold: 0.9,
    });

    expect(response2.hits.length).toBeLessThanOrEqual(0);
  });

  test(`${permission} key: search with distinct`, async () => {
    const client = await getClient(permission);
    const response = await client
      .index(index.uid)
      .search("", { distinct: "author" });

    expect(response.hits.length).toEqual(7);
  });

  test(`${permission} key: search with retrieveVectors to true`, async () => {
    const client = await getClient(permission);

    const response = await client.index(index.uid).searchGet("prince", {
      retrieveVectors: true,
    });

    expect(response).toHaveProperty("hits", expect.any(Array));
    expect(response).toHaveProperty("query", "prince");
    expect(response.hits[0]).toHaveProperty("_vectors");
  });

  test(`${permission} key: search without retrieveVectors`, async () => {
    const client = await getClient(permission);

    const response = await client.index(index.uid).searchGet("prince");

    expect(response).toHaveProperty("hits", expect.any(Array));
    expect(response).toHaveProperty("query", "prince");
    expect(response.hits[0]).not.toHaveProperty("_vectors");
  });

  test(`${permission} key: matches position contain indices`, async () => {
    const client = await getClient(permission);
    const response = await client.index(index.uid).searchGet("fantasy", {
      showMatchesPosition: true,
    });
    expect(response.hits[0]._matchesPosition).toEqual({
      genre: [{ start: 0, length: 7, indices: [0] }],
    });
  });

  // This test deletes the index, so following tests may fail if they need an existing index
  test(`${permission} key: Try to search on deleted index and fail`, async () => {
    const client = await getClient(permission);
    const masterClient = await getClient("Master");
    const { taskUid } = await masterClient.index(index.uid).delete();
    await masterClient.waitForTask(taskUid);
    await expect(
      client.index(index.uid).searchGet("prince"),
    ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INDEX_NOT_FOUND);
  });
});

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`get search route`, async () => {
    const route = `indexes/${index.uid}/search`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.index(index.uid).searchGet()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`post search route`, async () => {
    const route = `indexes/${index.uid}/search`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.index(index.uid).searchGet()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
