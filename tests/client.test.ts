import {
  afterAll,
  expect,
  test,
  describe,
  beforeEach,
  vi,
  type MockInstance,
  beforeAll,
  assert,
} from "vitest";
import type { Health, Version, Stats } from "../src/index.js";
import { ErrorStatusCode, TaskTypes } from "../src/index.js";
import { PACKAGE_VERSION } from "../src/package-version.js";
import {
  clearAllIndexes,
  getKey,
  getClient,
  config,
  MeiliSearch,
  BAD_HOST,
  HOST,
} from "./utils/meilisearch-test-utils.js";

const indexNoPk = {
  uid: "movies_test",
};
const indexPk = {
  uid: "movies_test2",
  primaryKey: "id",
};

const index = {
  uid: "movies_test",
};

const index2 = {
  uid: "movies_test2",
};

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([
  { permission: "Master" },
  { permission: "Admin" },
  { permission: "Search" },
])("Test on client instance", ({ permission }) => {
  beforeEach(() => {
    return clearAllIndexes(config);
  });

  test(`${permission} key: Create client with api key`, async () => {
    const key = await getKey(permission);
    const client = new MeiliSearch({
      ...config,
      apiKey: key,
    });
    const health = await client.isHealthy();
    expect(health).toBe(true);
  });

  describe("Header tests", () => {
    let fetchSpy: MockInstance<typeof fetch>;

    beforeAll(() => {
      fetchSpy = vi.spyOn(globalThis, "fetch");
    });

    afterAll(() => fetchSpy.mockRestore());

    test(`${permission} key: Create client with custom headers (object)`, async () => {
      const key = await getKey(permission);
      const client = new MeiliSearch({
        ...config,
        apiKey: key,
        requestInit: {
          headers: {
            "Hello-There!": "General Kenobi",
          },
        },
      });

      await client.multiSearch(
        { queries: [] },
        { headers: { "Jane-Doe": "John Doe" } },
      );

      assert.isDefined(fetchSpy.mock.lastCall);
      const [, requestInit] = fetchSpy.mock.lastCall!;

      assert.isDefined(requestInit?.headers);
      assert.instanceOf(requestInit!.headers, Headers);

      const headers = requestInit!.headers! as Headers;

      assert.strictEqual(headers.get("Hello-There!"), "General Kenobi");
      assert.strictEqual(headers.get("Jane-Doe"), "John Doe");
    });

    test(`${permission} key: Create client with custom headers (array)`, async () => {
      const key = await getKey(permission);
      const client = new MeiliSearch({
        ...config,
        apiKey: key,
        requestInit: {
          headers: [["Hello-There!", "General Kenobi"]],
        },
      });

      assert.isTrue(await client.isHealthy());

      assert.isDefined(fetchSpy.mock.lastCall);
      const [, requestInit] = fetchSpy.mock.lastCall!;

      assert.isDefined(requestInit?.headers);
      assert.instanceOf(requestInit!.headers, Headers);
      assert.strictEqual(
        (requestInit!.headers! as Headers).get("Hello-There!"),
        "General Kenobi",
      );
    });

    test(`${permission} key: Create client with custom headers (Headers)`, async () => {
      const key = await getKey(permission);
      const headers = new Headers();
      headers.set("Hello-There!", "General Kenobi");
      const client = new MeiliSearch({
        ...config,
        apiKey: key,
        requestInit: { headers },
      });

      assert.isTrue(await client.isHealthy());

      assert.isDefined(fetchSpy.mock.lastCall);
      const [, requestInit] = fetchSpy.mock.lastCall!;

      assert.isDefined(requestInit?.headers);
      assert.instanceOf(requestInit!.headers, Headers);
      assert.strictEqual(
        (requestInit!.headers! as Headers).get("Hello-There!"),
        "General Kenobi",
      );
    });
  });

  test(`${permission} key: No double slash when on host with domain and path and trailing slash`, async () => {
    const key = await getKey(permission);
    try {
      const customHost = `${BAD_HOST}/api/`;
      const client = new MeiliSearch({
        host: customHost,
        apiKey: key,
      });
      const health = await client.isHealthy();
      expect(health).toBe(false); // Left here to trigger failed test if error is not thrown
    } catch (e: any) {
      expect(e.message).toMatch(`${BAD_HOST}/api/health`);
      expect(e.name).toBe("MeiliSearchRequestError");
    }
  });

  test(`${permission} key: No double slash when on host with domain and path and no trailing slash`, async () => {
    const key = await getKey(permission);
    try {
      const customHost = `${BAD_HOST}/api`;
      const client = new MeiliSearch({
        host: customHost,
        apiKey: key,
      });
      const health = await client.isHealthy();
      expect(health).toBe(false); // Left here to trigger failed test if error is not thrown
    } catch (e: any) {
      expect(e.message).toMatch(`${BAD_HOST}/api/health`);
      expect(e.name).toBe("MeiliSearchRequestError");
    }
  });

  test(`${permission} key: host with double slash should keep double slash`, async () => {
    const key = await getKey(permission);
    try {
      const customHost = `${BAD_HOST}//`;
      const client = new MeiliSearch({
        host: customHost,
        apiKey: key,
      });
      const health = await client.isHealthy();
      expect(health).toBe(false); // Left here to trigger failed test if error is not thrown
    } catch (e: any) {
      expect(e.message).toMatch(`${BAD_HOST}//health`);
      expect(e.name).toBe("MeiliSearchRequestError");
    }
  });

  test(`${permission} key: host with one slash should not double slash`, async () => {
    const key = await getKey(permission);
    try {
      const customHost = `${BAD_HOST}/`;
      const client = new MeiliSearch({
        host: customHost,
        apiKey: key,
      });
      const health = await client.isHealthy();
      expect(health).toBe(false); // Left here to trigger failed test if error is not thrown
    } catch (e: any) {
      expect(e.message).toMatch(`${BAD_HOST}/health`);
      expect(e.name).toBe("MeiliSearchRequestError");
    }
  });

  test(`${permission} key: bad host raise CommunicationError`, async () => {
    const client = new MeiliSearch({ host: "http://localhost:9345" });
    try {
      await client.health();
    } catch (e: any) {
      expect(e.name).toEqual("MeiliSearchRequestError");
    }
  });

  test(`${permission} key: host without HTTP should not throw Invalid URL Error`, () => {
    const strippedHost = HOST.replace("http://", "");
    expect(() => {
      new MeiliSearch({ host: strippedHost });
    }).not.toThrow("The provided host is not valid.");
  });

  test(`${permission} key: host without HTTP and port should not throw Invalid URL Error`, () => {
    const strippedHost = HOST.replace("http://", "").replace(":7700", "");
    expect(() => {
      new MeiliSearch({ host: strippedHost });
    }).not.toThrow("The provided host is not valid.");
  });

  test(`${permission} key: Empty string host should throw an error`, () => {
    expect(() => {
      new MeiliSearch({ host: "" });
    }).toThrow("The provided host is not valid");
  });
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on client w/ master and admin key",
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config);
    });

    test(`${permission} key: Create client with custom headers`, async () => {
      const key = await getKey(permission);
      const client = new MeiliSearch({
        ...config,
        apiKey: key,
        requestInit: {
          headers: {
            "Hello-There!": "General Kenobi",
          },
        },
      });
      expect(client.config.requestInit?.headers).toStrictEqual({
        "Hello-There!": "General Kenobi",
      });
      const health = await client.isHealthy();

      expect(health).toBe(true);

      const task = await client.createIndex("test");
      await client.waitForTask(task.taskUid);

      const { results } = await client.getIndexes();

      expect(results.length).toBe(1);
    });

    test(`${permission} key: Create client with custom http client`, async () => {
      const key = await getKey(permission);
      const client = new MeiliSearch({
        ...config,
        apiKey: key,
        async httpClient(...params: Parameters<typeof fetch>) {
          const result = await fetch(...params);
          return result.json();
        },
      });
      const health = await client.isHealthy();

      expect(health).toBe(true);

      const task = await client.createIndex("test");
      await client.waitForTask(task.taskUid);

      const { results } = await client.getIndexes();

      expect(results.length).toBe(1);

      const index = await client.getIndex("test");

      const { taskUid } = await index.addDocuments([
        { id: 1, title: "index_2" },
      ]);
      await client.waitForTask(taskUid);

      const { results: documents } = await index.getDocuments();
      expect(documents.length).toBe(1);
    });

    describe("Header tests", () => {
      let fetchSpy: MockInstance<typeof fetch>;

      beforeAll(() => {
        fetchSpy = vi.spyOn(globalThis, "fetch");
      });

      afterAll(() => fetchSpy.mockRestore());

      test(`${permission} key: Create client with no custom client agents`, async () => {
        const key = await getKey(permission);
        const client = new MeiliSearch({
          ...config,
          apiKey: key,
          requestInit: {
            headers: {},
          },
        });

        assert.isTrue(await client.isHealthy());

        assert.isDefined(fetchSpy.mock.lastCall);
        const [, requestInit] = fetchSpy.mock.lastCall!;

        assert.isDefined(requestInit?.headers);
        assert.instanceOf(requestInit!.headers, Headers);
        assert.strictEqual(
          (requestInit!.headers! as Headers).get("X-Meilisearch-Client"),
          `Meilisearch JavaScript (v${PACKAGE_VERSION})`,
        );
      });

      test(`${permission} key: Create client with empty custom client agents`, async () => {
        const key = await getKey(permission);
        const client = new MeiliSearch({
          ...config,
          apiKey: key,
          clientAgents: [],
        });

        assert.isTrue(await client.isHealthy());

        assert.isDefined(fetchSpy.mock.lastCall);
        const [, requestInit] = fetchSpy.mock.lastCall!;

        assert.isDefined(requestInit?.headers);
        assert.instanceOf(requestInit!.headers, Headers);
        assert.strictEqual(
          (requestInit!.headers! as Headers).get("X-Meilisearch-Client"),
          `Meilisearch JavaScript (v${PACKAGE_VERSION})`,
        );
      });

      test(`${permission} key: Create client with custom client agents`, async () => {
        const key = await getKey(permission);
        const client = new MeiliSearch({
          ...config,
          apiKey: key,
          clientAgents: ["random plugin 1", "random plugin 2"],
        });

        assert.isTrue(await client.isHealthy());

        assert.isDefined(fetchSpy.mock.lastCall);
        const [, requestInit] = fetchSpy.mock.lastCall!;

        assert.isDefined(requestInit?.headers);
        assert.instanceOf(requestInit!.headers, Headers);
        assert.strictEqual(
          (requestInit!.headers! as Headers).get("X-Meilisearch-Client"),
          `random plugin 1 ; random plugin 2 ; Meilisearch JavaScript (v${PACKAGE_VERSION})`,
        );
      });
    });

    describe("Test on indexes methods", () => {
      test(`${permission} key: create with no primary key`, async () => {
        const client = await getClient(permission);
        const task = await client.createIndex(indexNoPk.uid);
        await client.waitForTask(task.taskUid);

        const newIndex = await client.getIndex(indexNoPk.uid);
        expect(newIndex).toHaveProperty("uid", indexNoPk.uid);
        expect(newIndex).toHaveProperty("primaryKey", null);

        const rawIndex = await client.index(indexNoPk.uid).getRawInfo();
        expect(rawIndex).toHaveProperty("uid", indexNoPk.uid);
        expect(rawIndex).toHaveProperty("primaryKey", null);
        expect(rawIndex).toHaveProperty("createdAt", expect.any(String));
        expect(rawIndex).toHaveProperty("updatedAt", expect.any(String));

        const response = await client.getIndex(indexNoPk.uid);
        expect(response.primaryKey).toBe(null);
        expect(response.uid).toBe(indexNoPk.uid);
      });

      test(`${permission} key: create with primary key`, async () => {
        const client = await getClient(permission);
        const { taskUid } = await client.createIndex(indexPk.uid, {
          primaryKey: indexPk.primaryKey,
        });
        await client.waitForTask(taskUid);

        const newIndex = await client.getIndex(indexPk.uid);

        expect(newIndex).toHaveProperty("uid", indexPk.uid);
        expect(newIndex).toHaveProperty("primaryKey", indexPk.primaryKey);

        const rawIndex = await client.index(indexPk.uid).getRawInfo();
        expect(rawIndex).toHaveProperty("primaryKey", indexPk.primaryKey);
        expect(rawIndex).toHaveProperty("createdAt", expect.any(String));
        expect(rawIndex).toHaveProperty("updatedAt", expect.any(String));

        const response = await client.getIndex(indexPk.uid);
        expect(response.primaryKey).toBe(indexPk.primaryKey);
        expect(response.uid).toBe(indexPk.uid);
      });

      test(`${permission} key: get all indexes when not empty`, async () => {
        const client = await getClient(permission);

        const { taskUid } = await client.createIndex(indexPk.uid);
        await client.waitForTask(taskUid);

        const { results } = await client.getRawIndexes();
        const indexes = results.map((index: any) => index.uid);
        expect(indexes).toEqual(expect.arrayContaining([indexPk.uid]));
        expect(indexes.length).toEqual(1);
      });

      test(`${permission} key: Get index that exists`, async () => {
        const client = await getClient(permission);

        const { taskUid } = await client.createIndex(indexPk.uid);
        await client.waitForTask(taskUid);

        const response = await client.getIndex(indexPk.uid);

        expect(response).toHaveProperty("uid", indexPk.uid);
      });

      test(`${permission} key: Get index that does not exist`, async () => {
        const client = await getClient(permission);

        await expect(client.getIndex("does_not_exist")).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.INDEX_NOT_FOUND,
        );
      });

      test(`${permission} key: update primary key`, async () => {
        const client = await getClient(permission);
        const { taskUid: createTask } = await client.createIndex(indexPk.uid);
        await client.waitForTask(createTask);
        const { taskUid: updateTask } = await client.updateIndex(indexPk.uid, {
          primaryKey: "newPrimaryKey",
        });
        await client.waitForTask(updateTask);

        const index = await client.getIndex(indexPk.uid);

        expect(index).toHaveProperty("uid", indexPk.uid);
        expect(index).toHaveProperty("primaryKey", "newPrimaryKey");
      });

      test(`${permission} key: update primary key that already exists`, async () => {
        const client = await getClient(permission);
        const { taskUid: createTask } = await client.createIndex(indexPk.uid, {
          primaryKey: indexPk.primaryKey,
        });
        await client.waitForTask(createTask);
        const { taskUid: updateTask } = await client.updateIndex(indexPk.uid, {
          primaryKey: "newPrimaryKey",
        });
        await client.waitForTask(updateTask);

        const index = await client.getIndex(indexPk.uid);

        expect(index).toHaveProperty("uid", indexPk.uid);
        expect(index).toHaveProperty("primaryKey", "newPrimaryKey");
      });

      test(`${permission} key: delete index`, async () => {
        const client = await getClient(permission);
        const { taskUid: createTask } = await client.createIndex(indexNoPk.uid);
        await client.waitForTask(createTask);

        const { taskUid: deleteTask } = await client.deleteIndex(indexNoPk.uid);
        await client.waitForTask(deleteTask);
        const { results } = await client.getIndexes();

        expect(results).toHaveLength(0);
      });

      test(`${permission} key: create index with already existing uid should fail`, async () => {
        const client = await getClient(permission);
        const { taskUid: firstCreate } = await client.createIndex(indexPk.uid);
        await client.waitForTask(firstCreate);

        const { taskUid: secondCreate } = await client.createIndex(indexPk.uid);
        const task = await client.waitForTask(secondCreate);

        expect(task.status).toBe("failed");
      });

      test(`${permission} key: delete index with uid that does not exist should fail`, async () => {
        const client = await getClient(permission);
        const index = client.index(indexNoPk.uid);
        const { taskUid } = await index.delete();

        const task = await client.waitForTask(taskUid);

        expect(task.status).toEqual("failed");
      });

      test(`${permission} key: fetch deleted index should fail`, async () => {
        const client = await getClient(permission);
        const index = client.index(indexPk.uid);
        await expect(index.getRawInfo()).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.INDEX_NOT_FOUND,
        );
      });

      test(`${permission} key: Swap two indexes`, async () => {
        const client = await getClient(permission);
        await client
          .index(index.uid)
          .addDocuments([{ id: 1, title: `index_1` }]);
        const { taskUid } = await client
          .index(index2.uid)
          .addDocuments([{ id: 1, title: "index_2" }]);
        await client.waitForTask(taskUid);
        const swaps = [
          {
            indexes: [index.uid, index2.uid],
          },
        ];

        const swapTask = await client.swapIndexes(swaps);
        const resolvedTask = await client.waitForTask(swapTask.taskUid);
        const docIndex1 = await client.index(index.uid).getDocument(1);
        const docIndex2 = await client.index(index2.uid).getDocument(1);

        expect(docIndex1.title).toEqual("index_2");
        expect(docIndex2.title).toEqual("index_1");
        expect(resolvedTask.type).toEqual(TaskTypes.INDEXES_SWAP);
        expect(resolvedTask.details.swaps).toEqual(swaps);
      });

      test(`${permission} key: Swap two indexes with one that does not exist`, async () => {
        const client = await getClient(permission);

        const { taskUid } = await client
          .index(index2.uid)
          .addDocuments([{ id: 1, title: "index_2" }]);

        await client.waitForTask(taskUid);
        const swaps = [
          {
            indexes: ["does_not_exist", index2.uid],
          },
        ];

        const swapTask = await client.swapIndexes(swaps);
        const resolvedTask = await client.waitForTask(swapTask.taskUid);

        expect(resolvedTask.type).toEqual(TaskTypes.INDEXES_SWAP);
        expect(resolvedTask.error?.code).toEqual(
          ErrorStatusCode.INDEX_NOT_FOUND,
        );
        expect(resolvedTask.details.swaps).toEqual(swaps);
      });

      // Should be fixed by rc1
      test(`${permission} key: Swap two one index with itself`, async () => {
        const client = await getClient(permission);

        const swaps = [
          {
            indexes: [index.uid, index.uid],
          },
        ];

        await expect(client.swapIndexes(swaps)).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.INVALID_SWAP_DUPLICATE_INDEX_FOUND,
        );
      });
    });

    describe("Test on base routes", () => {
      test(`${permission} key: get health`, async () => {
        const client = await getClient(permission);
        const response: Health = await client.health();
        expect(response).toHaveProperty(
          "status",
          expect.stringMatching("available"),
        );
      });

      test(`${permission} key: is server healthy`, async () => {
        const client = await getClient(permission);
        const response: boolean = await client.isHealthy();
        expect(response).toBe(true);
      });

      test(`${permission} key: is healthy return false on bad host`, async () => {
        const client = new MeiliSearch({ host: "http://localhost:9345" });
        const response: boolean = await client.isHealthy();
        expect(response).toBe(false);
      });

      test(`${permission} key: get version`, async () => {
        const client = await getClient(permission);
        const response: Version = await client.getVersion();
        expect(response).toHaveProperty("commitSha", expect.any(String));
        expect(response).toHaveProperty("commitDate", expect.any(String));
        expect(response).toHaveProperty("pkgVersion", expect.any(String));
      });

      test(`${permission} key: get /stats information`, async () => {
        const client = await getClient(permission);
        const response: Stats = await client.getStats();
        expect(response).toHaveProperty("databaseSize", expect.any(Number));
        expect(response).toHaveProperty("lastUpdate"); // TODO: Could be null, find out why
        expect(response).toHaveProperty("indexes", expect.any(Object));
      });
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on misc client methods w/ search apikey",
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config);
    });

    describe("Test on indexes methods", () => {
      test(`${permission} key: try to get all indexes and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.getIndexes()).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.INVALID_API_KEY,
        );
      });

      test(`${permission} key: try to create Index with primary key and be denied`, async () => {
        const client = await getClient(permission);
        await expect(
          client.createIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          }),
        ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
      });

      test(`${permission} key: try to create Index with NO primary key and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.createIndex(indexNoPk.uid)).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.INVALID_API_KEY,
        );
      });

      test(`${permission} key: try to delete index and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.deleteIndex(indexPk.uid)).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.INVALID_API_KEY,
        );
      });

      test(`${permission} key: try to update index and be denied`, async () => {
        const client = await getClient(permission);
        await expect(
          client.updateIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          }),
        ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
      });
    });

    describe("Test on misc client methods", () => {
      test(`${permission} key: get health`, async () => {
        const client = await getClient(permission);
        const response: Health = await client.health();
        expect(response).toHaveProperty(
          "status",
          expect.stringMatching("available"),
        );
      });

      test(`${permission} key: try to get version and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.getVersion()).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.INVALID_API_KEY,
        );
      });

      test(`${permission} key: try to get /stats information and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.getStats()).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.INVALID_API_KEY,
        );
      });
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on misc client methods w/ no apiKey client",
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config);
    });

    describe("Test on indexes methods", () => {
      test(`${permission} key: try to get all indexes and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.getIndexes()).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
        );
      });

      test(`${permission} key: try to create Index with primary key and be denied`, async () => {
        const client = await getClient(permission);
        await expect(
          client.createIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          }),
        ).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
        );
      });

      test(`${permission} key: try to create Index with NO primary key and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.createIndex(indexNoPk.uid)).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
        );
      });

      test(`${permission} key: try to delete index and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.deleteIndex(indexPk.uid)).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
        );
      });

      test(`${permission} key: try to update index and be denied`, async () => {
        const client = await getClient(permission);
        await expect(
          client.updateIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          }),
        ).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
        );
      });
    });

    describe("Test on misc client methods", () => {
      test(`${permission} key: get health`, async () => {
        const client = await getClient(permission);
        const response: Health = await client.health();
        expect(response).toHaveProperty(
          "status",
          expect.stringMatching("available"),
        );
      });

      test(`${permission} key: try to get version and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.getVersion()).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
        );
      });

      test(`${permission} key: try to get /stats information and be denied`, async () => {
        const client = await getClient(permission);
        await expect(client.getStats()).rejects.toHaveProperty(
          "cause.code",
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
        );
      });
    });
  },
);

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])("Tests on url construction", ({ host, trailing }) => {
  test(`getIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.getIndex(indexPk.uid)).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`createIndex route`, async () => {
    const route = `indexes`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.createIndex(indexPk.uid)).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.updateIndex(indexPk.uid)).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`deleteIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.deleteIndex(indexPk.uid)).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`get indexes route`, async () => {
    const route = `indexes`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.getIndexes()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`getKeys route`, async () => {
    const route = `keys`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.getKeys()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`health route`, async () => {
    const route = `health`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.health()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`stats route`, async () => {
    const route = `stats`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.getStats()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`version route`, async () => {
    const route = `version`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(client.getVersion()).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
