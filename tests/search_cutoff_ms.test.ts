import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import { ErrorStatusCode } from "../src/types/index.js";
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  dataset,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "movies_test",
};

const DEFAULT_SEARCHCUTOFFMS = null;

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on searchCutoffMs",
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config);
      const client = await getClient("Master");
      const { taskUid } = await client.index(index.uid).addDocuments(dataset);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: Get default searchCutoffMs settings`, async () => {
      const client = await getClient(permission);
      const response = await client.index(index.uid).getSearchCutoffMs();

      expect(response).toEqual(DEFAULT_SEARCHCUTOFFMS);
    });

    test(`${permission} key: Update searchCutoffMs to valid value`, async () => {
      const client = await getClient(permission);
      const newSearchCutoffMs = 100;
      const task = await client
        .index(index.uid)
        .updateSearchCutoffMs(newSearchCutoffMs);
      await client.waitForTask(task.taskUid);

      const response = await client.index(index.uid).getSearchCutoffMs();

      expect(response).toEqual(newSearchCutoffMs);
    });

    test(`${permission} key: Update searchCutoffMs to null`, async () => {
      const client = await getClient(permission);
      const newSearchCutoffMs = null;
      const task = await client
        .index(index.uid)
        .updateSearchCutoffMs(newSearchCutoffMs);
      await client.index(index.uid).waitForTask(task.taskUid);

      const response = await client.index(index.uid).getSearchCutoffMs();

      expect(response).toEqual(DEFAULT_SEARCHCUTOFFMS);
    });

    test(`${permission} key: Update searchCutoffMs with invalid value`, async () => {
      const client = await getClient(permission);
      const newSearchCutoffMs = "hello" as any; // bad searchCutoffMs value

      await expect(
        client.index(index.uid).updateSearchCutoffMs(newSearchCutoffMs),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.INVALID_SETTINGS_SEARCH_CUTOFF_MS,
      );
    });

    test(`${permission} key: Reset searchCutoffMs`, async () => {
      const client = await getClient(permission);
      const newSearchCutoffMs = 100;
      const updateTask = await client
        .index(index.uid)
        .updateSearchCutoffMs(newSearchCutoffMs);
      await client.waitForTask(updateTask.taskUid);
      const task = await client.index(index.uid).resetSearchCutoffMs();
      await client.waitForTask(task.taskUid);

      const response = await client.index(index.uid).getSearchCutoffMs();

      expect(response).toEqual(DEFAULT_SEARCHCUTOFFMS);
    });
  },
);

describe.each([{ permission: "Search" }])(
  "Test on searchCutoffMs",
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient("Master");
      const { taskUid } = await client.createIndex(index.uid);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: try to get searchCutoffMs and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getSearchCutoffMs(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to update searchCutoffMs and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateSearchCutoffMs(100),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });

    test(`${permission} key: try to reset searchCutoffMs and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetSearchCutoffMs(),
      ).rejects.toHaveProperty("cause.code", ErrorStatusCode.INVALID_API_KEY);
    });
  },
);

describe.each([{ permission: "No" }])(
  "Test on searchCutoffMs",
  ({ permission }) => {
    beforeAll(async () => {
      const client = await getClient("Master");
      const { taskUid } = await client.createIndex(index.uid);
      await client.waitForTask(taskUid);
    });

    test(`${permission} key: try to get searchCutoffMs and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).getSearchCutoffMs(),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to update searchCutoffMs and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).updateSearchCutoffMs(100),
      ).rejects.toHaveProperty(
        "cause.code",
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER,
      );
    });

    test(`${permission} key: try to reset searchCutoffMs and be denied`, async () => {
      const client = await getClient(permission);
      await expect(
        client.index(index.uid).resetSearchCutoffMs(),
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
  test(`getSearchCutoffMs route`, async () => {
    const route = `indexes/${index.uid}/settings/search-cutoff-ms`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).getSearchCutoffMs(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`updateSearchCutoffMs route`, async () => {
    const route = `indexes/${index.uid}/settings/search-cutoff-ms`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).updateSearchCutoffMs(null),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });

  test(`resetSearchCutoffMs route`, async () => {
    const route = `indexes/${index.uid}/settings/search-cutoff-ms`;
    const client = new MeiliSearch({ host });
    const strippedHost = trailing ? host.slice(0, -1) : host;
    await expect(
      client.index(index.uid).resetSearchCutoffMs(),
    ).rejects.toHaveProperty(
      "message",
      `Request to ${strippedHost}/${route} has failed`,
    );
  });
});
