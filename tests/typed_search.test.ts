import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import { ErrorStatusCode, type SearchResponse } from "../src/types/index.js";
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  datasetWithNests,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "movies_test",
};
const emptyIndex = {
  uid: "empty_test",
};

interface Movie {
  id: number;
  title: string;
  comment?: string;
  genre?: string[];
  isNull?: null;
  isTrue?: boolean;
}

interface NestedDocument {
  id: number;
  title: string;
  info: {
    comment?: string;
    reviewNb?: number;
  };
}

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
    isNull: null,
    isTrue: true,
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
])("Test on search", ({ permission }) => {
  beforeAll(async () => {
    const client = await getClient("Master");
    await clearAllIndexes(config);

    await client.createIndex(index.uid).waitTask();
    await client.createIndex(emptyIndex.uid).waitTask();

    const newFilterableAttributes = ["genre", "title"];
    await client
      .index<Movie>(index.uid)
      .updateFilterableAttributes(newFilterableAttributes)
      .waitTask();

    await client.index<Movie>(index.uid).addDocuments(dataset).waitTask();
  });

  test(`${permission} key: Basic search`, async () => {
    const client = await getClient(permission);
    const response = await client.index<Movie>(index.uid).search("prince", {});
    expect(response.hits.length === 2).toBeTruthy();
    expect(response.limit === 20).toBeTruthy();
    expect(response.offset === 0).toBeTruthy();
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response.query === "prince").toBeTruthy();
  });

  test(`${permission} key: Search with query in searchParams`, async () => {
    const client = await getClient(permission);
    const response = await client
      .index(index.uid)
      .search("other", { q: "prince" }); // ensures `q` is a valid field in SearchParams type

    expect(response).toHaveProperty("query", "prince");
  });

  test(`${permission} key: Search with options`, async () => {
    const client = await getClient(permission);
    const response = await client
      .index<Movie>(index.uid)
      .search("prince", { limit: 1 });
    expect(response.hits.length === 1).toBeTruthy();
    expect(response.offset === 0).toBeTruthy();
    expect(response.limit === 1).toBeTruthy();
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response.query === "prince").toBeTruthy();
  });

  test(`${permission} key: Search with limit and offset`, async () => {
    const client = await getClient(permission);
    const response = await client.index<Movie>(index.uid).search("prince", {
      limit: 1,
      offset: 1,
    });
    expect(response.hits.length === 1).toBeTruthy();
    expect(response.offset === 1).toBeTruthy();
    // expect(response.bloub).toEqual(0) -> ERROR, bloub does not exist on type Response
    expect(response.limit === 1).toBeTruthy();
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response.query === "prince").toBeTruthy();
    expect(response.hits[0].id).toEqual(4);
    expect(response.hits[0].title).toEqual(
      "Harry Potter and the Half-Blood Prince",
    );
    expect(response.hits[0].comment).toEqual("The best book");
    expect(response.hits[0].genre).toEqual(["fantasy", "adventure"]);
    expect(response.query === "prince").toBeTruthy();
  });

  test(`${permission} key: Search with matches parameter and small croplength`, async () => {
    const client = await getClient(permission);
    const response = await client.index<Movie>(index.uid).search("prince", {
      filter: 'title = "Le Petit Prince"',
      attributesToCrop: ["*"],
      cropLength: 5,
      showMatchesPosition: true,
    });
    expect(response.hits.length === 1).toBeTruthy();
    expect(response.hits[0]?._matchesPosition?.comment).toEqual([
      { start: 22, length: 6 },
    ]);
    expect(response.hits[0]?._matchesPosition?.title).toEqual([
      { start: 9, length: 6 },
    ]);
  });

  test(`${permission} key: Search with all options but not all fields`, async () => {
    const client = await getClient(permission);
    const response = await client.index<Movie>(index.uid).search("prince", {
      limit: 5,
      offset: 0,
      attributesToRetrieve: ["id", "title"],
      attributesToCrop: ["*"],
      cropLength: 6,
      attributesToHighlight: ["*"],
      filter: 'title = "Le Petit Prince"',
      showMatchesPosition: true,
    });
    expect(response.hits.length === 1).toBeTruthy();
    expect(response.offset === 0).toBeTruthy();
    expect(response.limit === 5).toBeTruthy();
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response.query === "prince").toBeTruthy();
    expect(response.hits[0]._formatted).toHaveProperty(
      "title",
      "Le Petit <em>Prince</em>",
    );
    expect(response.hits[0]._formatted?.id).toEqual("456");
    expect(response.hits[0]).not.toHaveProperty("comment");
    expect(response.hits[0]).not.toHaveProperty("description");
    expect(response.hits[0]._formatted).toHaveProperty("comment");
    expect(response.hits[0]._formatted).not.toHaveProperty("description");
    expect(response.hits.length === 1).toBeTruthy();
    expect(response.hits[0]).toHaveProperty(
      "_matchesPosition",
      expect.any(Object),
    );
  });

  test(`${permission} key: Search with all options and all fields`, async () => {
    const client = await getClient(permission);
    const response = await client.index<Movie>(index.uid).search("prince", {
      limit: 5,
      offset: 0,
      attributesToRetrieve: ["*"],
      attributesToCrop: ["*"],
      cropLength: 6,
      attributesToHighlight: ["*"],
      filter: 'title = "Le Petit Prince"',
      showMatchesPosition: true,
    });
    expect(response.hits.length === 1).toBeTruthy();
    expect(response.offset === 0).toBeTruthy();
    expect(response.limit === 5).toBeTruthy();
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response.query === "prince").toBeTruthy();
    expect(response.hits[0]?.title === "Le Petit Prince").toBeTruthy();
    expect(
      response.hits[0]?._matchesPosition?.title?.[0]?.start === 9,
    ).toBeTruthy();
    expect(
      response.hits[0]?._matchesPosition?.title?.[0]?.length === 6,
    ).toBeTruthy();
    expect(response.hits[0]._formatted).toHaveProperty(
      "title",
      "Le Petit <em>Prince</em>",
    );
  });

  test(`${permission} key: Search with all options but specific fields`, async () => {
    const client = await getClient(permission);
    const response = await client.index<Movie>(index.uid).search("prince", {
      limit: 5,
      offset: 0,
      attributesToRetrieve: ["id", "title"],
      attributesToCrop: ["id", "title"],
      cropLength: 6,
      attributesToHighlight: ["id", "title"],
      filter: 'title = "Le Petit Prince"',
      showMatchesPosition: true,
    });
    expect(response.hits.length === 1).toBeTruthy();
    expect(response.offset === 0).toBeTruthy();
    expect(response.limit === 5).toBeTruthy();
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response.query === "prince").toBeTruthy();

    expect(response.hits[0].id).toEqual(456);
    expect(response.hits[0].title).toEqual("Le Petit Prince");
    // ERROR Property 'comment' does not exist on type 'Hit<Pick<Movie, "id" | "title">>'.
    // expect(response.hits[0].comment).toEqual('comment')

    expect(response.hits[0]?.title === "Le Petit Prince").toBeTruthy();
    expect(response.hits[0]?._matchesPosition?.title).toEqual([
      { start: 9, length: 6 },
    ]);
    expect(response.hits[0]._formatted).toHaveProperty(
      "title",
      "Le Petit <em>Prince</em>",
    );
    expect(response.hits[0]).not.toHaveProperty(
      "description",
      expect.any(Object),
    );
    expect(response.hits[0]._formatted).not.toHaveProperty("comment");
  });

  test(`${permission} key: Search with specific fields in attributesToHighlight and check for types of number fields`, async () => {
    const client = await getClient(permission);
    const response = await client.index<Movie>(index.uid).search("prince", {
      attributesToHighlight: ["title"],
    });
    expect(response.hits[0]._formatted?.id).toEqual("456");
    expect(response.hits[0]._formatted?.isNull).toEqual(null);
    expect(response.hits[0]._formatted?.isTrue).toEqual(true);
  });

  test(`${permission} key: Search with specific fields in attributesToHighlight and check for types of number fields`, async () => {
    const client = await getClient(permission);
    const response = await client.index<Movie>(index.uid).search("prince", {
      attributesToHighlight: ["title", "id"],
    });
    expect(response.hits[0]._formatted?.id).toEqual("456");
    expect(response.hits[0]._formatted?.isNull).toEqual(null);
    expect(response.hits[0]._formatted?.isTrue).toEqual(true);
  });

  test(`${permission} key: Search with filter and facets`, async () => {
    const client = await getClient(permission);
    const response = await client.index<Movie>(index.uid).search("a", {
      filter: ["genre=romance"],
      facets: ["genre"],
    });
    expect(response.facetDistribution?.genre?.romance === 2).toBeTruthy();
    expect(response.hits.length === 2).toBeTruthy();
  });

  test(`${permission} key: Search with filter with spaces`, async () => {
    const client = await getClient(permission);
    const response = await client.index<Movie>(index.uid).search("h", {
      filter: ['genre="sci fi"'],
    });
    expect(response).toHaveProperty("hits");
    expect(Array.isArray(response.hits)).toBe(true);
    expect(response.hits.length === 1).toBeTruthy();
  });

  test(`${permission} key: Search with multiple filter`, async () => {
    const client = await getClient(permission);
    const response = await client.index<Movie>(index.uid).search("a", {
      filter: ["genre=romance", ["genre=romance", "genre=romance"]],
      facets: ["genre"],
    });
    expect(response.facetDistribution?.genre?.romance === 2).toBeTruthy();
    expect(response.hits.length === 2).toBeTruthy();
  });

  test(`${permission} key: Search with multiple filter and placeholder search using undefined`, async () => {
    const client = await getClient(permission);
    const response = await client.index<Movie>(index.uid).search(undefined, {
      filter: ["genre = fantasy"],
      facets: ["genre"],
    });
    expect(response.facetDistribution?.genre?.fantasy === 3).toBeTruthy();
    expect(response.hits.length === 3).toBeTruthy();
  });

  test(`${permission} key: Search with multiple filter and placeholder search using NULL`, async () => {
    const client = await getClient(permission);
    const response = await client.index<Movie>(index.uid).search(null, {
      filter: ["genre = fantasy"],
      facets: ["genre"],
    });
    expect(response.facetDistribution?.genre?.fantasy === 3).toBeTruthy();
    expect(response.hits.length === 3).toBeTruthy();
  });

  test(`${permission} key: Search on index with no documents and no primary key`, async () => {
    const client = await getClient(permission);
    const response = await client.index(emptyIndex.uid).search("prince", {});

    expect(response.hits.length === 0).toBeTruthy();
    expect(response).toHaveProperty("processingTimeMs", expect.any(Number));
    expect(response.query === "prince").toBeTruthy();
  });

  test(`${permission} key: search with pagination parameters hitsPerPage/page and offset`, async () => {
    const client = await getClient(permission);

    const response = await client.index<Movie>(index.uid).search("", {
      hitsPerPage: 1,
      page: 1,
      limit: 1,
    });

    expect(response.hits.length).toEqual(1);
    expect(response.hitsPerPage === 1).toBeTruthy();
    expect(response.page === 1).toBeTruthy();
    expect(response.totalPages === 8).toBeTruthy();
    expect(response.totalHits === 8).toBeTruthy();
  });

  test(`${permission} key: Try to Search on deleted index and fail`, async () => {
    const client = await getClient(permission);
    const masterClient = await getClient("Master");
    await masterClient.index<Movie>(index.uid).delete().waitTask();

    await expect(
      client.index<Movie>(index.uid).search("prince"),
    ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INDEX_NOT_FOUND);
  });
});

describe.each([{ permission: "Master" }])(
  "Tests on documents with nested objects",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("Master");
      await client.createIndex(index.uid);

      await client.index(index.uid).addDocuments(datasetWithNests).waitTask();
    });

    test(`${permission} key: search on nested content with no parameters`, async () => {
      const client = await getClient(permission);
      const response: SearchResponse<NestedDocument> = await client
        .index<NestedDocument>(index.uid)
        .search("An awesome", {});

      expect(response.hits[0].info?.comment === "An awesome book").toBeTruthy();
      expect(response.hits[0].info?.reviewNb === 900).toBeTruthy();
    });

    test(`${permission} key: search on nested content with searchable on specific nested field`, async () => {
      const client = await getClient(permission);
      await client
        .index(index.uid)
        .updateSettings({
          searchableAttributes: ["title", "info.comment"],
        })
        .waitTask();

      const response: SearchResponse<NestedDocument> = await client
        .index<NestedDocument>(index.uid)
        .search("An awesome", {});

      expect(response.hits[0].info?.comment === "An awesome book").toBeTruthy();
      expect(response.hits[0].info?.reviewNb === 900).toBeTruthy();
    });

    test(`${permission} key: search on nested content with sort`, async () => {
      const client = await getClient(permission);
      await client
        .index(index.uid)
        .updateSettings({
          searchableAttributes: ["title", "info.comment"],
          sortableAttributes: ["info.reviewNb"],
        })
        .waitTask();

      const response: SearchResponse<NestedDocument> = await client
        .index<NestedDocument>(index.uid)
        .search("", {
          sort: ["info.reviewNb:desc"],
        });

      expect(response.hits[0].info?.comment === "The best book").toBeTruthy();
      expect(response.hits[0].info?.reviewNb === 1000).toBeTruthy();
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test failing test on search",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
    });

    test(`${permission} key: Try Basic search and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index<Movie>(index.uid).search("prince"),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`get search route`, async () => {
    const route = `indexes/${index.uid}/search`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index<Movie>(index.uid).search(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`post search route`, async () => {
    const route = `indexes/${index.uid}/search`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index<Movie>(index.uid).search(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
